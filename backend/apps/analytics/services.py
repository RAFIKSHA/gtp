from django.db.models import Avg, Max, Count, Sum
from apps.questions.models import StudentAttempt
from apps.mock_tests.models import MockTestAttempt
from apps.academics.models import Subject, Topic, TopicProgress


class AnalyticsEngine:
    """
    Central aggregation and recommendation service.
    Processes verified student submissions from Supabase to provide real performance insights.
    Zero fabricated or randomly generated metrics.
    """

    def __init__(self, student_profile):
        self.student = student_profile

    def get_overview_metrics(self) -> dict:
        """
        Computes high-level student metrics across practice and examination modules.
        """
        attempts = StudentAttempt.objects.filter(student=self.student)
        total_questions_attempted = attempts.count()
        correct_count = attempts.filter(is_correct=True).count()
        incorrect_count = attempts.filter(is_correct=False).count()

        accuracy_percentage = (
            round((correct_count / total_questions_attempted * 100), 1)
            if total_questions_attempted > 0
            else 0.0
        )

        # Negative marks incurred (sum of negative marks for incorrect MCQs)
        negative_marks_sum = sum(
            abs(att.marks_awarded)
            for att in attempts
            if att.marks_awarded < 0
        )

        # Mock tests summary
        completed_tests = MockTestAttempt.objects.filter(
            student=self.student,
            status__in=["submitted", "auto_submitted"]
        )
        tests_completed_count = completed_tests.count()
        avg_score = completed_tests.aggregate(Avg("score_obtained"))["score_obtained__avg"]
        best_score = completed_tests.aggregate(Max("score_obtained"))["score_obtained__max"]

        # Topic completion progress
        total_topics = Topic.objects.filter(is_active=True).count()
        completed_topics = TopicProgress.objects.filter(
            student=self.student,
            is_completed=True
        ).count()
        syllabus_progress = (
            round((completed_topics / total_topics * 100), 1)
            if total_topics > 0
            else 0.0
        )

        return {
            "total_questions_attempted": total_questions_attempted,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "accuracy_percentage": accuracy_percentage,
            "negative_marks_incurred": round(negative_marks_sum, 2),
            "tests_completed_count": tests_completed_count,
            "average_test_score": round(avg_score, 2) if avg_score is not None else None,
            "best_test_score": round(best_score, 2) if best_score is not None else None,
            "completed_topics_count": completed_topics,
            "total_topics_count": total_topics,
            "syllabus_progress_percentage": syllabus_progress,
        }

    def get_subject_performance(self) -> list:
        """
        Aggregates performance by subject, calculating accuracy, total attempts, and strong/weak tags.
        """
        subjects = Subject.objects.prefetch_related("topics").all()
        attempts = StudentAttempt.objects.filter(student=self.student).select_related("question__topic__subject")

        # Map attempts by subject ID
        subject_attempts_map = {}
        for att in attempts:
            subj_id = att.question.topic.subject_id
            if subj_id not in subject_attempts_map:
                subject_attempts_map[subj_id] = {"total": 0, "correct": 0, "net_marks": 0.0}
            subject_attempts_map[subj_id]["total"] += 1
            if att.is_correct:
                subject_attempts_map[subj_id]["correct"] += 1
            subject_attempts_map[subj_id]["net_marks"] += att.marks_awarded

        result = []
        for s in subjects:
            stats = subject_attempts_map.get(s.id, {"total": 0, "correct": 0, "net_marks": 0.0})
            total = stats["total"]
            correct = stats["correct"]
            accuracy = round((correct / total * 100), 1) if total > 0 else 0.0

            # Rule: Don't label weak based on 1 attempt. Require >= 3 attempts for definitive strength tags.
            if total >= 3:
                if accuracy >= 75:
                    status_tag = "Strong"
                elif accuracy <= 45:
                    status_tag = "Needs Revision"
                else:
                    status_tag = "Moderate"
            else:
                status_tag = "Developing" if total > 0 else "Unattempted"

            result.append({
                "subject_id": s.id,
                "subject_name": s.name,
                "slug": s.slug,
                "total_topics": s.topics.count(),
                "questions_attempted": total,
                "correct_count": correct,
                "net_marks": round(stats["net_marks"], 2),
                "accuracy_percentage": accuracy,
                "status_tag": status_tag,
            })

        return result

    def get_recommendations(self) -> list:
        """
        Rule-Based Recommendation Engine:
        Evaluates topics by student accuracy, attempt density, and syllabus completion.
        Never tags a topic as weak on a single mistake.
        """
        topics = Topic.objects.select_related("subject").all()
        attempts = StudentAttempt.objects.filter(student=self.student).select_related("question__topic")
        progress_map = {
            p.topic_id: p.is_completed
            for p in TopicProgress.objects.filter(student=self.student)
        }

        # Group attempts by topic
        topic_stats = {}
        for att in attempts:
            t_id = att.question.topic_id
            if t_id not in topic_stats:
                topic_stats[t_id] = {"total": 0, "correct": 0}
            topic_stats[t_id]["total"] += 1
            if att.is_correct:
                topic_stats[t_id]["correct"] += 1

        recommendations = []
        for t in topics:
            stats = topic_stats.get(t.id, {"total": 0, "correct": 0})
            total = stats["total"]
            correct = stats["correct"]
            accuracy = round((correct / total * 100), 1) if total > 0 else 0.0
            is_completed = progress_map.get(t.id, False)

            # Rule 1: High Priority Weak Topic (Attempt count >= 3, accuracy < 55%)
            if total >= 3 and accuracy < 55:
                recommendations.append({
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "subject_name": t.subject.name,
                    "subject_slug": t.subject.slug,
                    "type": "weak_topic",
                    "priority": "High",
                    "badge": "Revision Recommended",
                    "reason": f"Accuracy is {accuracy}% across {total} attempts. Review concept notes and formula proofs.",
                    "attempts": total,
                    "accuracy": accuracy,
                })

            # Rule 2: Unstudied Core Syllabus (No attempts and syllabus not marked completed)
            elif total == 0 and not is_completed:
                recommendations.append({
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "subject_name": t.subject.name,
                    "subject_slug": t.subject.slug,
                    "type": "pending_concept",
                    "priority": "Medium",
                    "badge": "Concept Unvisited",
                    "reason": "You haven't explored this syllabus topic yet. Read concept notes to build foundation.",
                    "attempts": 0,
                    "accuracy": 0.0,
                })

            # Rule 3: Practice Needed (Syllabus marked complete but under-practiced)
            elif is_completed and total < 2:
                recommendations.append({
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "subject_name": t.subject.name,
                    "subject_slug": t.subject.slug,
                    "type": "practice_needed",
                    "priority": "Medium",
                    "badge": "Practice Needed",
                    "reason": "Theory marked complete, but insufficient question attempts recorded.",
                    "attempts": total,
                    "accuracy": accuracy,
                })

            # Rule 4: Mastered Strength (Attempt count >= 3, accuracy >= 80%)
            elif total >= 3 and accuracy >= 80:
                recommendations.append({
                    "topic_id": t.id,
                    "topic_name": t.name,
                    "subject_name": t.subject.name,
                    "subject_slug": t.subject.slug,
                    "type": "strength",
                    "priority": "Low",
                    "badge": "Strong Area",
                    "reason": f"Excellent accuracy of {accuracy}%. Keep this topic sharp with periodic PYQ drills.",
                    "attempts": total,
                    "accuracy": accuracy,
                })

        # Sort recommendations: High priority first, then Medium, then Low
        priority_order = {"High": 1, "Medium": 2, "Low": 3}
        recommendations.sort(key=lambda x: priority_order.get(x["priority"], 4))
        return recommendations[:8]  # Top actionable recommendations

    def get_test_history(self) -> list:
        """
        Chronological log of completed mock test attempts.
        """
        attempts = MockTestAttempt.objects.filter(
            student=self.student,
            status__in=["submitted", "auto_submitted"]
        ).select_related("mock_test").order_by("-completed_at")[:10]

        return [
            {
                "attempt_id": str(att.id),
                "test_id": str(att.mock_test.id),
                "test_title": att.mock_test.title,
                "test_type": att.mock_test.test_type,
                "score_obtained": att.score_obtained,
                "total_marks": att.total_possible_marks,
                "accuracy_percentage": att.accuracy_percentage,
                "time_spent_seconds": att.time_spent_seconds,
                "completed_at": att.completed_at.isoformat() if att.completed_at else None,
                "is_qualified": att.score_obtained >= att.mock_test.passing_marks,
            }
            for att in attempts
        ]

