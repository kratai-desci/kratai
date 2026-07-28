# Reproduces the App/Person/Student bug report for Python:
# local variables declared inside a method should never be treated as class
# fields, whether they're plain assignments or type-annotated (PEP 526).

class Person:
    def __init__(self, name):
        self.name = name


class Student(Person):
    def __init__(self, student_id, name):
        super().__init__(name)
        self.student_id = student_id


class App:
    """Well-formed, single-line method signature."""

    @staticmethod
    def main():
        s1 = Student(1, "John")
        s2: Student = Student(2, "Joe")

        print(s1 == s2)


class MultiLineSignatureApp:
    """Same scenario, but the method signature spans multiple lines -
    the Python equivalent of Java's `throws` clause breaking method-body
    detection."""

    @staticmethod
    def main(
        argv,
    ):
        s1 = Student(1, "John")
        s2: Student = Student(2, "Joe")

        print(s1 == s2)
