// Code Practice Examples
// Contains pre-built examples for different programming languages

const EXAMPLES = {
  javascript: {
    courseTitle: "Modern JavaScript",
    practiceTitle: "Code Practice 1.1",
    language: "javascript",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two JavaScript functions that have been started for you:\n\n1. `addNumbers` - Should return the result of adding the two parameter values.\n\n2. `isEven` - Should return `true` if the parameter is an even number, otherwise `false`.\n\n> You can use: `num % 2 === 0` to determine if `num` is even.",
    configCode: `// Configuration code runs before student code
// This code is hidden from students and sets up the environment
const runTests = () => {
	console.log("Running tests...")

	// check addNumbers:
	const sum = addNumbers(15, 25)
	console.log("addNumbers(15, 25) = " + sum, sum === 40 ? "Correct!" : "Incorrect")

	// check isEven:
	const evenTest = isEven(8)
	console.log("isEven(8) = " + evenTest, evenTest === true ? "Correct!" : "Incorrect")
}

// The student code will be inserted here:
/*{{student_code}}*/

// Testing student functions
runTests()`,
    startingCode: `// Hello /*{{first_name}}*/! Welcome to your coding assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/

// 1. Create a function that adds two numbers
function addNumbers(a, b) {
    // TODO: Write your code here

}

// 2. Create a function that checks if a number is even (Hint: number % 2 === 0)
function isEven(num) {
    // TODO: Write your code here

}`
  },
  python: {
    courseTitle: "Python Programming",
    practiceTitle: "Code Practice 1.1",
    language: "python",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two Python functions that have been started for you:\n\n1. `add_numbers` - Should return the result of adding the two parameter values.\n\n2. `is_even` - Should return `True` if the parameter is an even number, otherwise `False`.\n\n> You can use: `num % 2 == 0` to determine if `num` is even.",
    configCode: `# Configuration code runs before student code
# This code is hidden from students and sets up the environment

def run_tests():
    print("Running tests...")
    
    # Test add_numbers function
    result = add_numbers(15, 25)
    print(f"add_numbers(15, 25) = {result}", "Correct!" if result == 40 else "Incorrect")
    
    # Test is_even function
    even_test = is_even(8)
    print(f"is_even(8) = {even_test}", "Correct!" if even_test == True else "Incorrect")

# Student code will be inserted here:
#{{student_code}}

# Run the tests
run_tests()`,
    startingCode: `# Hello #{{first_name}}! Welcome to your Python assignment.
# Student ID: #{{id}} | Course: #{{course_title}}
# Assignment: #{{practice_title}}

# 1. Create a function that adds two numbers
def add_numbers(a, b):
    # TODO: Write your code here
    pass

# 2. Create a function that checks if a number is even
def is_even(num):
    # TODO: Write your code here
    pass`
  },
  csharp: {
    courseTitle: "C# Programming",
    practiceTitle: "Code Practice 1.1",
    language: "csharp",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two C# methods that have been started for you:\n\n1. `AddNumbers` - Should return the result of adding the two parameter values.\n\n2. `IsEven` - Should return `true` if the parameter is an even number, otherwise `false`.\n\n> You can use: `num % 2 == 0` to determine if `num` is even.",
    configCode: `// Configuration code runs before student code
using System;

public class TestRunner 
{
    public void RunTests() 
    {
        Console.WriteLine("Running tests...");
        
        // Test AddNumbers method
        int sum = AddNumbers(15, 25);
        Console.WriteLine($"AddNumbers(15, 25) = {sum} {(sum == 40 ? "Correct!" : "Incorrect")}");
        
        // Test IsEven method  
        bool evenTest = IsEven(8);
        Console.WriteLine($"IsEven(8) = {evenTest} {(evenTest == true ? "Correct!" : "Incorrect")}");
    }

	// Student code will be inserted here:
	/*{{student_code}}*/
}

public class Program
{    
    public static void Main()
    {
		TestRunner runner = new TestRunner();
        runner.RunTests();
    }
}
`,
    startingCode: `// Hello /*{{first_name}}*/! Welcome to your C# assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/

// 1. Create a method that adds two numbers
public int AddNumbers(int a, int b)
{
	// TODO: Write your code here
	return 0;
}

// 2. Create a method that checks if a number is even
public bool IsEven(int num)
{
	// TODO: Write your code here
	return false;
}`
  },
  java: {
    courseTitle: "Java Programming",
    practiceTitle: "Code Practice 1.1",
    language: "java",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two Java methods that have been started for you:\n\n1. `addNumbers` - Should return the result of adding the two parameter values.\n\n2. `isEven` - Should return `true` if the parameter is an even number, otherwise `false`.\n\n> You can use: `num % 2 == 0` to determine if `num` is even.",
    configCode: `// Configuration code runs before student code
public class TestRunner {
    public static void runTests() {
        System.out.println("Running tests...");
        
        // Test addNumbers method
        int sum = Main.addNumbers(15, 25);
        System.out.println("addNumbers(15, 25) = " + sum + " " + (sum == 40 ? "Correct!" : "Incorrect"));
        
        // Test isEven method
        boolean evenTest = Main.isEven(8);
        System.out.println("isEven(8) = " + evenTest + " " + (evenTest == true ? "Correct!" : "Incorrect"));
    }
}

// Student code will be inserted here:
/*{{student_code}}*/`,
    startingCode: `// Hello /*{{first_name}}*/! Welcome to your Java assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/

public class Main {
    // 1. Create a method that adds two numbers
    public static int addNumbers(int a, int b) {
        // TODO: Write your code here
        return 0;
    }

    // 2. Create a method that checks if a number is even
    public static boolean isEven(int num) {
        // TODO: Write your code here
        return false;
    }
    
    public static void main(String[] args) {
        TestRunner.runTests();
    }
}`
  },
  cpp: {
    courseTitle: "C++ Programming", 
    practiceTitle: "Code Practice 1.1",
    language: "cpp",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two C++ functions that have been started for you:\n\n1. `addNumbers` - Should return the result of adding the two parameter values.\n\n2. `isEven` - Should return `true` if the parameter is an even number, otherwise `false`.\n\n> You can use: `num % 2 == 0` to determine if `num` is even.",
    configCode: `#include <iostream>
using namespace std;

// Function prototypes
int addNumbers(int a, int b);
bool isEven(int num);

void runTests() {
    cout << "Running tests..." << endl;
    
    // Test addNumbers function
    int sum = addNumbers(15, 25);
    cout << "addNumbers(15, 25) = " << sum << " " << (sum == 40 ? "Correct!" : "Incorrect") << endl;
    
    // Test isEven function
    bool evenTest = isEven(8);
    cout << "isEven(8) = " << (evenTest ? "true" : "false") << " " << (evenTest == true ? "Correct!" : "Incorrect") << endl;
}

// Student code will be inserted here:
/*{{student_code}}*/

int main() {
    runTests();
    return 0;
}`,
    startingCode: `// Hello /*{{first_name}}*/! Welcome to your C++ assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/

// 1. Create a function that adds two numbers
int addNumbers(int a, int b) {
    // TODO: Write your code here
    return 0;
}

// 2. Create a function that checks if a number is even (Hint: use %)
bool isEven(int num) {
    // TODO: Write your code here
    return false;
}`
  },
  php: {
    courseTitle: "PHP Programming",
    practiceTitle: "Code Practice 1.1", 
    language: "php",
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two PHP functions that have been started for you:\n\n1. `addNumbers` - Should return the result of adding the two parameter values.\n\n2. `isEven` - Should return `true` if the parameter is an even number, otherwise `false`.\n\n> You can use: `$num % 2 == 0` to determine if `$num` is even.",
    configCode: `<?php
// Configuration code runs before student code

function runTests() {
    echo "Running tests...\\n";
    
    // Test addNumbers function
    $sum = addNumbers(15, 25);
    echo "addNumbers(15, 25) = $sum " . ($sum == 40 ? "Correct!" : "Incorrect") . "\\n";
    
    // Test isEven function
    $evenTest = isEven(8);
    echo "isEven(8) = " . ($evenTest ? "true" : "false") . " " . ($evenTest === true ? "Correct!" : "Incorrect") . "\\n";
}

// Student code will be inserted here:
/*{{student_code}}*/

// Run tests
runTests();
?>`,
    startingCode: `<?php
// Hello /*{{first_name}}*/! Welcome to your PHP assignment.
// Student ID: /*{{id}}*/ | Course: /*{{course_title}}*/
// Assignment: /*{{practice_title}}*/

// 1. Create a function that adds two numbers
function addNumbers($a, $b) {
    // TODO: Write your code here
    return 0;
}

// 2. Create a function that checks if a number is even
function isEven($num) {
    // TODO: Write your code here
    return false;
}
?>`
  },
  powershell: {
    courseTitle: "PowerShell Scripting",
    practiceTitle: "Code Practice 1.1",
    language: "powershell", 
    instructions: "# Code Practice 1.1 Instructions\n\nFinish the two PowerShell functions that have been started for you:\n\n1. `Add-Numbers` - Should return the result of adding the two parameter values.\n\n2. `Test-IsEven` - Should return `$true` if the parameter is an even number, otherwise `$false`.\n\n> You can use: `$num % 2 -eq 0` to determine if `$num` is even.",
    configCode: `<#
Configuration code runs before student code
This code is hidden from students and sets up the environment
Welcome <#{{first_name}}#> <#{{last_name}}#>!
#>

function Run-Tests {
    Write-Host "Running tests..."
    
    # Test Add-Numbers function
    $sum = Add-Numbers 15 25
    Write-Host "Add-Numbers 15 25 = $sum" $(if($sum -eq 40) {"Correct!"} else {"Incorrect"})
    
    # Test Test-IsEven function  
    $evenTest = Test-IsEven 8
    Write-Host "Test-IsEven 8 = $evenTest" $(if($evenTest -eq $true) {"Correct!"} else {"Incorrect"})
}

# Student code will be inserted here:
<#{{student_code}}#>

# Run the tests
Run-Tests`,
    startingCode: `<#
Welcome <#{{first_name}}#> <#{{last_name}}#>!
Student ID: <#{{id}}#>
Course: <#{{course_title}}#>
Assignment: <#{{practice_title}}#>
#>

# 1. Create a function that adds two numbers
function Add-Numbers($a, $b) {
    # TODO: Write your code here
    return 0
}

# 2. Create a function that checks if a number is even
function Test-IsEven($num) {
    # TODO: Write your code here
    return $false
}`
  }
};

// Export for ES6 modules
export default EXAMPLES;