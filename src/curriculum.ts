import { Topic } from "./types";

export const CURRICULUM: Topic[] = [
  {
    id: 1,
    name: "C File Anatomy & Compilation Pipeline",
    subCategories: [
      { id: "1:1", name: "What a .c file looks like", description: "Understand the structure of a raw C file." },
      { id: "1:2", name: "#include", description: "Learn how headers are included using preprocessor directives." },
      { id: "1:3", name: "main()", description: "The execution entry point of any C program." },
      { id: "1:4", name: "Comments", description: "Syntax for single-line and multi-line comments." },
      { id: "1:5", name: "Compilation pipeline", description: "The stages: preprocessor → compiler → assembler → linker." },
      { id: "1:6", name: "Compiling with gcc", description: "Command-line compilation using gcc flags." }
    ]
  },
  {
    id: 2,
    name: "Data Types & Variables",
    subCategories: [
      { id: "2:1", name: "int", description: "Standard signed integer types and formats." },
      { id: "2:2", name: "float and double", description: "Single and double precision floating-point numbers." },
      { id: "2:3", name: "char", description: "Single character storage and ASCII association." },
      { id: "2:4", name: "Declaration vs initialization", description: "Reserving space vs assigning an initial value." },
      { id: "2:5", name: "Naming rules", description: "Valid and invalid identifier names in C." },
      { id: "2:6", name: "sizeof", description: "Determining memory size of types or variables at compile-time." },
      { id: "2:7", name: "Signed vs unsigned", description: "Range shifts, conversion behaviors, and overflow traps." },
      { id: "2:8", name: "Type casting", description: "Implicit conversion and explicit custom type promotion." },
      { id: "2:9", name: "Constants (const and #define)", description: "Creating immutable variables and preprocessor replacements." },
      { id: "2:10", name: "void", description: "The empty type, function parameters, and generic return value." }
    ]
  },
  {
    id: 3,
    name: "Output (printf)",
    subCategories: [
      { id: "3:1", name: "Basic printf with a string", description: "Printing terminal string literals." },
      { id: "3:2", name: "Format specifiers", description: "Placeholders like %d, %f, %c, %s." },
      { id: "3:3", name: "Escape characters", description: "Control characters like \\n, \\t, and \\\\." },
      { id: "3:4", name: "Field width and precision", description: "Formatting whitespace padding and floating decimal precision." },
      { id: "3:5", name: "Printing multiple variables", description: "Handling multiple placeholders in physical sequence." }
    ]
  },
  {
    id: 4,
    name: "Input (scanf)",
    subCategories: [
      { id: "4:1", name: "Basic scanf with %d", description: "Reading typed numbers into variables." },
      { id: "4:2", name: "The & operator", description: "Address-of operator required for assignment." },
      { id: "4:3", name: "Reading different types", description: "Formatting specifiers custom to input streams." },
      { id: "4:4", name: "Common pitfalls (newline buffer)", description: "Stray trailing newlines left behind in stdin." },
      { id: "4:5", name: "fgets as safer alternative", description: "Reading input safer than standard scanf." }
    ]
  },
  {
    id: 5,
    name: "Operators",
    subCategories: [
      { id: "5:1", name: "Arithmetic", description: "+, -, *, /, and % operations." },
      { id: "5:2", name: "Integer division trap", description: "How division between integers truncates decimals." },
      { id: "5:3", name: "Compound assignment", description: "Shorthands like +=, -=, *=, /=, %=." },
      { id: "5:4", name: "Increment and decrement", description: "Prefix vs postfix differences: ++x vs x++." },
      { id: "5:5", name: "Comparison operators", description: "Evaluating equality and inequality constraints." },
      { id: "5:6", name: "Logical operators", description: "AND (&&), OR (||), and NOT (!) logic filters." },
      { id: "5:7", name: "Operator precedence", description: "Order of evaluation and grouping with parentheses." },
      { id: "5:8", name: "Short-circuit evaluation", description: "Skipping expressions when final logical output is clear." }
    ]
  },
  {
    id: 6,
    name: "Bitwise Operations",
    subCategories: [
      { id: "6:1", name: "Binary number basics", description: "Bits, bytes, representation of signed/unsigned numbers." },
      { id: "6:2", name: "AND, OR, XOR, NOT", description: "Logical bit shifting operations: &, |, ^, ~." },
      { id: "6:3", name: "Left shift, right shift", description: "Shifting bits sideways using << and >> operators." },
      { id: "6:4", name: "Common patterns", description: "Toggling, setting, and querying individual bits." },
      { id: "6:5", name: "Masking", description: "Isolating clusters of bits inside registers." },
      { id: "6:6", name: "Integer promotion trap", description: "Behavior of short/char bit operations promoted to int." }
    ]
  },
  {
    id: 7,
    name: "Control Flow",
    subCategories: [
      { id: "7:1", name: "if", description: "Basic conditional branch execution." },
      { id: "7:2", name: "else and else if", description: "Chain logic evaluations with defaults." },
      { id: "7:3", name: "Nesting if", description: "Multi-layered checking patterns." },
      { id: "7:4", name: "switch and case", description: "Value branching selectors." },
      { id: "7:5", name: "break and fallthrough", description: "Controlling switch state termination." },
      { id: "7:6", name: "default", description: "The fallback option inside a switch block." },
      { id: "7:7", name: "Ternary operator", description: "Compact conditional assignment syntax." }
    ]
  },
  {
    id: 8,
    name: "Loops",
    subCategories: [
      { id: "8:1", name: "while", description: "Pre-condition repetition loop structures." },
      { id: "8:2", name: "do...while", description: "Post-condition repetition loop structure." },
      { id: "8:3", name: "for loop anatomy", description: "Iteration variables, steps, bounds, and syntax." },
      { id: "8:4", name: "break and continue", description: "Interrupting iteration or skipping steps." },
      { id: "8:5", name: "Nested loops", description: "Loops within loops, such as matrix traversal." },
      { id: "8:6", name: "Infinite loops", description: "Designing and breaking purposeful dynamic cycles." },
      { id: "8:7", name: "Common loop patterns", description: "Summation, count accumulation, and search loops." }
    ]
  },
  {
    id: 9,
    name: "Functions",
    subCategories: [
      { id: "9:1", name: "Declaration vs definition", description: "Defining function signatures vs creating actual bodies." },
      { id: "9:2", name: "Parameters and arguments", description: "Placeholder variables vs typed evaluation values passed." },
      { id: "9:3", name: "Return types and return", description: "Retrieving calculated outputs from finished functions." },
      { id: "9:4", name: "void functions", description: "Functions that produce actions without values." },
      { id: "9:5", name: "Function prototypes", description: "Informing编译器 about names before compilation." },
      { id: "9:6", name: "Pass by value", description: "How variables are duplicated rather than re-assigned." },
      { id: "9:7", name: "Scope", description: "Variable lifetime boundaries and global vs local rules." },
      { id: "9:8", name: "Recursion basics", description: "Functions triggering themselves with base constraints." }
    ]
  },
  {
    id: 10,
    name: "Arrays",
    subCategories: [
      { id: "10:1", name: "Declaring and initializing", description: "Creating clusters of static elements sequentially." },
      { id: "10:2", name: "Accessing by index", description: "Accessing items using offsets from starting index 0." },
      { id: "10:3", name: "Looping through arrays", description: "Iterative inspection of linear structures." },
      { id: "10:4", name: "Array bounds", description: "The dangers of reading/writing outside bounds." },
      { id: "10:5", name: "Multidimensional arrays", description: "Matrices, grids, and coordinate systems." },
      { id: "10:6", name: "Arrays and sizeof", description: "Resolving arrays to exact footprints vs single-item footprint." },
      { id: "10:7", name: "Passing arrays to functions", description: "Understanding array decay and element pointers." }
    ]
  },
  {
    id: 11,
    name: "Strings",
    subCategories: [
      { id: "11:1", name: "Null terminator", description: "The fundamental ASCII 0 (\\0) marker ending strings." },
      { id: "11:2", name: "Declaring strings", description: "Init patterns with char pointers and stack array buffers." },
      { id: "11:3", name: "Core string functions", description: "Standard parsing tools like strlen, strcmp, strcpy, strcat." },
      { id: "11:4", name: "Why == fails on strings", description: "Comparing address locations rather than variable values." },
      { id: "11:5", name: "Buffer overflow risk", description: "Dangers of writing strings larger than target capacity." },
      { id: "11:6", name: "Safer alternatives (strncpy, snprintf)", description: "Preventing exploits using bounded operations." },
      { id: "11:7", name: "Reading strings with fgets", description: "Capturing lines of text safely from stdin." },
      { id: "11:8", name: "Iterating through a string", description: "Loop techniques parsing characters until the null byte." }
    ]
  },
  {
    id: 12,
    name: "Pointers",
    subCategories: [
      { id: "12:1", name: "What a pointer is", description: "Variables containing raw address values." },
      { id: "12:2", name: "& and *", description: "Address-of and dereference operators." },
      { id: "12:3", name: "Declaring pointers", description: "Asterisk notation matching variable bindings." },
      { id: "12:4", name: "Assignment and dereferencing", description: "Saving memory locations and manipulating points directly." },
      { id: "12:5", name: "NULL pointer", description: "Ground state representing empty boundaries." },
      { id: "12:6", name: "Pointer arithmetic", description: "Adjusting address pointers by byte multipliers." },
      { id: "12:7", name: "Pointers and arrays", description: "Unified pointer manipulation patterns." },
      { id: "12:8", name: "Pass by reference", description: "Passing address pointers to functions for persistent edits." },
      { id: "12:9", name: "const with pointers", description: "Constant pointers vs pointers to constant values." },
      { id: "12:10", name: "Pointer to pointer", description: "Multi-level addresses (e.g. char **argv)." },
      { id: "12:11", name: "void *", description: "Generic data pointers used for arbitrary transfers." },
      { id: "12:12", name: "%p format specifier", description: "Printing hex addresses correctly via printf." }
    ]
  },
  {
    id: 13,
    name: "Dynamic Memory",
    subCategories: [
      { id: "13:1", name: "Stack vs heap", description: "Static localized allocations vs flexible dynamic memories." },
      { id: "13:2", name: "malloc", description: "Allocating blocks of uninitialized bytes." },
      { id: "13:3", name: "calloc", description: "Allocating zero-initialized blocks of memory." },
      { id: "13:4", name: "realloc", description: "Scaling dynamic spaces safely." },
      { id: "13:5", name: "free", description: "Reclaiming dynamic spaces to prevent memory bloats." },
      { id: "13:6", name: "Memory leaks", description: "Losing pointers before releasing dynamic footprints." },
      { id: "13:7", name: "Dangling pointers", description: "Retaining addresses to areas already deallocated." },
      { id: "13:8", name: "Dynamic arrays", description: "Building run-time resizing storage vectors." },
      { id: "13:9", name: "Debugging tools (valgrind, sanitizers)", description: "Instrumenting software to find leaks." }
    ]
  },
  {
    id: 14,
    name: "Structs & Unions",
    subCategories: [
      { id: "14:1", name: "Defining a struct", description: "Bundling different types into custom compound labels." },
      { id: "14:2", name: "Declaring and initializing", description: "Creating and filling composite objects." },
      { id: "14:3", name: "Dot operator", description: "Accessing sub-fields of a concrete struct." },
      { id: "14:4", name: "Arrow operator (pointers to structs)", description: "Implicit dereferencing shorthand (->)." },
      { id: "14:5", name: "Passing structs to functions", description: "By-value copying vs passing efficiency with pointer structures." },
      { id: "14:6", name: "Arrays of structs", description: "Lists storing tabular records." },
      { id: "14:7", name: "Nested structs", description: "Placing structs inside other struct declarations." },
      { id: "14:8", name: "Unions", description: "Sharing identical block memory locations across different types." },
      { id: "14:9", name: "Padding and alignment", description: "Compiler-added offsets to map memory boundaries efficiently." }
    ]
  },
  {
    id: 15,
    name: "Enums & Typedefs",
    subCategories: [
      { id: "15:1", name: "Defining an enum", description: "Assigning readable integer constants." },
      { id: "15:2", name: "Enum values", description: "Index states, custom boundaries, and compiler handling." },
      { id: "15:3", name: "Enums for readability", description: "Replacing magic numbers with labeled states." },
      { id: "15:4", name: "typedef", description: "Declaring alternative labels for existing types." },
      { id: "15:5", name: "typedef with structs", description: "Standard pattern removing structure tag redundancy." }
    ]
  },
  {
    id: 16,
    name: "Preprocessor & Macros",
    subCategories: [
      { id: "16:1", name: "#define constants (deeper)", description: "Understanding lexical substitutions." },
      { id: "16:2", name: "Macros with arguments", description: "Defining inline pseudo-functions." },
      { id: "16:3", name: "Macro pitfalls", description: "Evaluation sequence bugs and parentheses solutions." },
      { id: "16:4", name: "Conditional compilation", description: "Usage of #ifdef, #ifndef, #else, #endif commands." }
    ]
  },
  {
    id: 17,
    name: "Multi-File Programs",
    subCategories: [
      { id: "17:1", name: "Why split files", description: "Logical system splitting and modularization advantages." },
      { id: "17:2", name: "Header files", description: "Declaring common features inside .h files." },
      { id: "17:3", name: "Source files", description: "Implementing functions inside corresponding .c files." },
      { id: "17:4", name: "#include quotes vs brackets", description: "User-defined searches vs standard system paths." },
      { id: "17:5", name: "Header guards and #pragma once", description: "Preventing multiple header definition compiler crashes." },
      { id: "17:6", name: "extern", description: "Sharing global variables across independent modules." },
      { id: "17:7", name: "static", description: "Restricting functions or global scopes to current module." },
      { id: "17:8", name: "Compiling multiple files", description: "Feeding multiple C source items to compiler commands." },
      { id: "17:9", name: "Linker error types", description: "Resolving 'undefined reference' issues." },
      { id: "17:10", name: "Basic Makefile", description: "Automating builds using make utilities." }
    ]
  },
  {
    id: 18,
    name: "Command-Line Arguments",
    subCategories: [
      { id: "18:1", name: "argc and argv signature", description: "Reading console variables in the main function." },
      { id: "18:2", name: "What argc and argv contain", description: "Determining path offsets and argument sequences." },
      { id: "18:3", name: "Parsing arguments", description: "Iterating through command options." },
      { id: "18:4", name: "String to number conversion", description: "Converting inputs using tools like atoi or strtol." }
    ]
  },
  {
    id: 19,
    name: "File I/O",
    subCategories: [
      { id: "19:1", name: "fopen and modes", description: "Accessing file streams with modes read, write, append." },
      { id: "19:2", name: "fclose", description: "Closing open streams to avoid data rot." },
      { id: "19:3", name: "fprintf and fscanf", description: "Formatted standard file inputs and output." },
      { id: "19:4", name: "fgets and fputs", description: "Line-oriented safety functions on streams." },
      { id: "19:5", name: "fread and fwrite", description: "Binary structure block transfers on storage streams." },
      { id: "19:6", name: "feof and error checking", description: "Evaluating end-of-file conditions." },
      { id: "19:7", name: "Error handling with fopen", description: "Handling missing variables and files safely." },
      { id: "19:8", name: "Streams vs file descriptors", description: "Buffered stream files vs OS level integers (conceptual)." }
    ]
  },
  {
    id: 20,
    name: "Standard Library Tour",
    subCategories: [
      { id: "20:1", name: "stdlib.h", description: "Basic utilities, processes, conversions, allocs." },
      { id: "20:2", name: "string.h", description: "Memory manipulation functions." },
      { id: "20:3", name: "math.h", description: "Trig and algebraic functions." },
      { id: "20:4", name: "ctype.h", description: "Ascii query functions like isdigit, isalpha." },
      { id: "20:5", name: "time.h", description: "System clock, epoch timers, and structures." },
      { id: "20:6", name: "assert.h", description: "Debug validation macros." },
      { id: "20:7", name: "Reading man pages", description: "Navigating index docs safely." }
    ]
  }
];
