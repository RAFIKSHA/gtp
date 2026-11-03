import uuid
from django.core.management.base import BaseCommand
from apps.academics.models import GatePaper, Subject, Topic
from apps.questions.models import Question
from apps.mock_tests.models import MockTest, MockTestQuestion


class Command(BaseCommand):
    help = "Seeds initial GATE mock tests and associates verified questions in Supabase"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Mock Tests into Supabase...")

        cs_paper = GatePaper.objects.get(code="CS")

        # 1. Full-Length All-India Mock Test 1
        full_test, _ = MockTest.objects.update_or_create(
            slug="gate-cse-full-length-mock-1",
            defaults={
                "title": "GATE CSE All-India Full-Length Mock 1",
                "paper": cs_paper,
                "test_type": "Full-Length",
                "duration_minutes": 180,
                "total_marks": 100.0,
                "total_questions": 65,
                "passing_marks": 27.6,
                "instructions": (
                    "1. Total duration of examination is 180 minutes.\n"
                    "2. The clock will be synchronized with the server.\n"
                    "3. For MCQ questions, negative marking of 1/3rd applies for incorrect answers.\n"
                    "4. For MSQ and NAT questions, NO negative marking applies.\n"
                    "5. You can use 'Mark for Review & Next' to flag questions for subsequent revision."
                ),
                "is_published": True,
            }
        )

        # 2. Discrete Math Sectional Test
        discrete_test, _ = MockTest.objects.update_or_create(
            slug="discrete-math-logic-sectional",
            defaults={
                "title": "Discrete Mathematics & Logic Sectional Test",
                "paper": cs_paper,
                "test_type": "Sectional",
                "duration_minutes": 45,
                "total_marks": 25.0,
                "total_questions": 15,
                "passing_marks": 10.0,
                "instructions": "Sectional test focusing on Propositional Logic, Set Theory, and Combinatorics.",
                "is_published": True,
            }
        )

        # 3. Algorithms & Data Structures Sectional Test
        algo_test, _ = MockTest.objects.update_or_create(
            slug="algorithms-ds-sectional",
            defaults={
                "title": "Algorithms & Data Structures Sectional Test",
                "paper": cs_paper,
                "test_type": "Sectional",
                "duration_minutes": 45,
                "total_marks": 25.0,
                "total_questions": 15,
                "passing_marks": 10.0,
                "instructions": "Sectional test focusing on Asymptotic Analysis, Sorting, Graphs, and Dynamic Programming.",
                "is_published": True,
            }
        )

        # Link questions to tests
        questions = list(Question.objects.all())
        self.stdout.write(f"Linking {len(questions)} verified questions into mock tests...")

        # Link questions to full-length test
        MockTestQuestion.objects.filter(mock_test=full_test).delete()
        for idx, q in enumerate(questions, start=1):
            neg = 0.33 if q.marks == 1 and q.question_type == "MCQ" else (0.66 if q.marks == 2 and q.question_type == "MCQ" else 0.0)
            MockTestQuestion.objects.create(
                mock_test=full_test,
                question=q,
                section_name="General Aptitude & Core CSE",
                order_index=idx,
                marks=float(q.marks),
                negative_mark=neg,
            )

        # Link Discrete Math questions
        discrete_qs = [q for q in questions if "Discrete" in q.topic.subject.name]
        MockTestQuestion.objects.filter(mock_test=discrete_test).delete()
        for idx, q in enumerate(discrete_qs, start=1):
            neg = 0.33 if q.marks == 1 and q.question_type == "MCQ" else 0.0
            MockTestQuestion.objects.create(
                mock_test=discrete_test,
                question=q,
                section_name="Discrete Mathematics",
                order_index=idx,
                marks=float(q.marks),
                negative_mark=neg,
            )

        # Link Algorithms questions
        algo_qs = [q for q in questions if "Algorithm" in q.topic.subject.name]
        MockTestQuestion.objects.filter(mock_test=algo_test).delete()
        for idx, q in enumerate(algo_qs, start=1):
            MockTestQuestion.objects.create(
                mock_test=algo_test,
                question=q,
                section_name="Algorithms",
                order_index=idx,
                marks=float(q.marks),
                negative_mark=0.0,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded 3 mock tests with question mappings in Supabase!"
        ))

