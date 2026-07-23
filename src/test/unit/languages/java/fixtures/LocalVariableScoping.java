package com.example.app;

/**
 * Reproduces the App/Person/Student bug report:
 * a method whose signature has a "throws" clause (so the closing
 * paren of the parameter list is NOT immediately followed by "{")
 * containing local variable declarations of a workspace class type.
 */
public class App {
    public static void main(String[] args) throws Exception {
        Student s1 = new Student(1, "John");
        Student s2 = new Student(2, "Joe");

        System.out.println(s1 == s2);
    }
}

class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }
}

class Student extends Person {
    private int studentId;

    public Student(int studentId, String name) {
        super(name);
        this.studentId = studentId;
    }
}
