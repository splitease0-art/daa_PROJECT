const ALGORITHMS = [
  {
    id: "bubble",
    name: "Bubble Sort",
    topic: "Sorting · Comparison",
    blurb: "Repeatedly compares adjacent elements and swaps them if they are in the wrong order.",
    explanation: `Bubble Sort is a comparison-based sorting algorithm. It makes several passes over the array. In each pass, neighbouring pairs are compared and swapped when the left value is larger than the right value. After one full pass, the largest remaining value has “bubbled” to the end of the unsorted region.

An optimized version tracks whether any swap occurred. If a pass completes with no swaps, the array is already sorted and the algorithm can stop early. That is why the best-case time is linear.

Bubble Sort is easy to understand and useful for teaching nested loops, but it is too slow for large data. It is a stable sort: equal keys keep their original relative order.`,
    pseudocode: `procedure BubbleSort(A[1..n])
    for i ← 1 to n - 1 do
        swapped ← false
        for j ← 1 to n - i do
            if A[j] > A[j + 1] then
                swap A[j] and A[j + 1]
                swapped ← true
            end if
        end for
        if swapped = false then
            return          // already sorted
        end if
    end for
end procedure`,
    time: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)"
    },
    space: "O(1)",
    extra: "In-place, stable. Best case assumes the early-exit (swapped-flag) optimization.",
    preTest: [
      {
        q: "Bubble Sort mainly works by:",
        options: ["Dividing the array into halves", "Comparing adjacent elements and swapping", "Building a heap", "Picking a random pivot"],
        a: 1
      },
      {
        q: "After the first full pass of Bubble Sort on n elements, which statement is true?",
        options: ["The array is fully sorted", "The smallest element is at index 0", "The largest element is at the last position", "All even indices are sorted"],
        a: 2
      },
      {
        q: "Typical worst-case time complexity of Bubble Sort is:",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        a: 3
      },
      {
        q: "Bubble Sort is generally considered:",
        options: ["In-place (O(1) extra memory)", "Requiring O(n) extra arrays", "Requiring O(n²) extra memory", "Impossible without recursion"],
        a: 0
      },
      {
        q: "If the input is already sorted and we use the swapped-flag optimization, Bubble Sort can finish in:",
        options: ["O(1)", "O(n)", "O(n log n)", "O(n²) always"],
        a: 1
      }
    ],
    postTest: [
      {
        q: "How many adjacent comparisons occur in one pass that bubbles the maximum to the end of an unsorted region of length k?",
        options: ["k", "k − 1", "k / 2", "log k"],
        a: 1
      },
      {
        q: "Worst-case number of swaps for Bubble Sort on n distinct keys is in:",
        options: ["Θ(n)", "Θ(n log n)", "Θ(n²)", "Θ(2ⁿ)"],
        a: 2
      },
      {
        q: "Why is classic Bubble Sort a stable sorting algorithm?",
        options: ["It never swaps", "Equal elements are not swapped past each other", "It uses a random pivot", "It always uses extra arrays"],
        a: 1
      },
      {
        q: "The outer loop of optimized Bubble Sort can stop early when:",
        options: ["i equals n/2", "A pass makes zero swaps", "The middle element is the median", "All values are negative"],
        a: 1
      },
      {
        q: "For large n, Bubble Sort is usually a poor choice compared with Merge Sort because:",
        options: ["It uses more extra memory", "Its average time is quadratic, not n log n", "It cannot sort integers", "It is unstable"],
        a: 1
      }
    ]
  },
  {
    id: "binary",
    name: "Binary Search",
    topic: "Searching · Divide and Conquer",
    blurb: "Finds a target in a sorted array by repeatedly discarding half of the remaining range.",
    explanation: `Binary Search locates a target value in a sorted array. It keeps two indices, low and high, that bound the still-possible region. The middle index mid is inspected:

• If A[mid] equals the target, the search succeeds.
• If the target is smaller, the search continues on the left half (high ← mid − 1).
• If the target is larger, it continues on the right half (low ← mid + 1).

Each comparison halves the search space, so the time is logarithmic. The array must be sorted; otherwise the discarded half may still contain the target.

Iterative Binary Search uses only a few extra variables (constant extra space). The same idea appears in many DAA problems: searching, lower-bound queries, and some optimization problems on monotonic functions.`,
    pseudocode: `procedure BinarySearch(A[1..n], target)
    // A is sorted in non-decreasing order
    low ← 1
    high ← n
    while low ≤ high do
        mid ← ⌊(low + high) / 2⌋
        if A[mid] = target then
            return mid
        else if A[mid] < target then
            low ← mid + 1
        else
            high ← mid − 1
        end if
    end while
    return NOT_FOUND
end procedure`,
    time: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)"
    },
    space: "O(1) iterative · O(log n) recursive (stack)",
    extra: "Precondition: the sequence must be sorted. Best case is a hit at the first mid.",
    preTest: [
      {
        q: "Binary Search requires which property of the input array?",
        options: ["All values unique", "Sorted order", "Even length", "Only positive numbers"],
        a: 1
      },
      {
        q: "Each unsuccessful comparison in Binary Search typically discards about:",
        options: ["One element", "Two elements", "Half of the remaining range", "The entire array"],
        a: 2
      },
      {
        q: "Worst-case time complexity of Binary Search on n elements is:",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(n²)"],
        a: 1
      },
      {
        q: "If target is smaller than A[mid], the next search range is:",
        options: ["mid .. high", "low .. mid − 1", "the whole array again", "only index 0"],
        a: 1
      },
      {
        q: "Linear Search vs Binary Search on a sorted array of size 1,000,000: Binary Search needs on the order of:",
        options: ["1,000,000 comparisons", "about 20 comparisons", "n² comparisons", "exactly 10 comparisons always"],
        a: 1
      }
    ],
    postTest: [
      {
        q: "The loop invariant of iterative Binary Search is that if the target exists, it lies in:",
        options: ["A[0] only", "A[low .. high]", "the already discarded half", "a random subarray"],
        a: 1
      },
      {
        q: "Maximum iterations of Binary Search on n elements is about:",
        options: ["n", "⌊log₂ n⌋ + 1", "n/2", "√n"],
        a: 1
      },
      {
        q: "Recursive Binary Search extra space (call stack) is:",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        a: 1
      },
      {
        q: "Binary Search on an unsorted array is:",
        options: ["Always correct", "Incorrect in general, because a discarded half may still hold the target", "Faster than on a sorted array", "Defined only for strings"],
        a: 1
      },
      {
        q: "Best-case time of Binary Search (target found immediately) is:",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        a: 0
      }
    ]
  },
  {
    id: "merge",
    name: "Merge Sort",
    topic: "Sorting · Divide and Conquer",
    blurb: "Divides the array, sorts each half, then merges two sorted runs into one.",
    explanation: `Merge Sort is a classic divide-and-conquer sort. It splits the array into two halves, recursively sorts each half, then merges the two sorted halves into a single sorted run.

Merging two sorted lists of total length n takes Θ(n) time: take the smaller of the two front elements at every step. The recurrence for time is

T(n) = 2 T(n/2) + Θ(n), T(1) = Θ(1)

which solves to Θ(n log n) in all cases (best, average, and worst). That predictable bound is a major reason Merge Sort is taught in DAA and used when a guaranteed n log n sort is required.

The standard implementation uses an auxiliary array, so extra space is Θ(n). Merge Sort is stable if the merge prefers the left run on ties.`,
    pseudocode: `procedure MergeSort(A, left, right)
    if left ≥ right then
        return
    end if
    mid ← ⌊(left + right) / 2⌋
    MergeSort(A, left, mid)
    MergeSort(A, mid + 1, right)
    Merge(A, left, mid, right)
end procedure

procedure Merge(A, left, mid, right)
    L ← A[left .. mid]
    R ← A[mid + 1 .. right]
    i ← 1; j ← 1; k ← left
    while i ≤ |L| and j ≤ |R| do
        if L[i] ≤ R[j] then
            A[k] ← L[i]; i ← i + 1
        else
            A[k] ← R[j]; j ← j + 1
        end if
        k ← k + 1
    end while
    copy any remaining items of L or R into A
end procedure`,
    time: {
      best: "Θ(n log n)",
      average: "Θ(n log n)",
      worst: "Θ(n log n)"
    },
    space: "O(n)",
    extra: "Stable (with a careful merge). Not in-place in the usual form. Recurrence: T(n) = 2T(n/2) + Θ(n).",
    preTest: [
      {
        q: "Merge Sort belongs to which design technique?",
        options: ["Greedy", "Dynamic programming", "Divide and conquer", "Backtracking"],
        a: 2
      },
      {
        q: "After dividing, Merge Sort combines halves by:",
        options: ["Swapping adjacent pairs only", "Merging two sorted sequences", "Picking a pivot", "Building a BST"],
        a: 1
      },
      {
        q: "Typical extra memory used by standard Merge Sort is:",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        a: 2
      },
      {
        q: "Worst-case time of Merge Sort is:",
        options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"],
        a: 1
      },
      {
        q: "Compared with Bubble Sort on large random arrays, Merge Sort is usually:",
        options: ["Slower", "About the same", "Much faster (n log n vs n²)", "Unable to sort numbers"],
        a: 2
      }
    ],
    postTest: [
      {
        q: "The Master Theorem applied to T(n) = 2T(n/2) + Θ(n) gives:",
        options: ["Θ(n)", "Θ(n log n)", "Θ(n²)", "Θ(log n)"],
        a: 1
      },
      {
        q: "Why is Merge Sort’s worst case the same order as its best case?",
        options: ["It always divides in half and always merges all n items at each level", "It stops after one comparison", "It uses a lucky pivot", "It never uses extra memory"],
        a: 0
      },
      {
        q: "Depth of the recursion tree for Merge Sort on n elements is:",
        options: ["Θ(1)", "Θ(log n)", "Θ(n)", "Θ(n²)"],
        a: 1
      },
      {
        q: "A stable merge of equal keys should:",
        options: ["Always take the right run first", "Take the left run first (preserve original order)", "Swap them randomly", "Drop duplicates"],
        a: 1
      },
      {
        q: "If each merge of size n costs Θ(n) and there are Θ(log n) levels, total time is:",
        options: ["Θ(n)", "Θ(n log n)", "Θ(n² log n)", "Θ(log n)"],
        a: 1
      }
    ]
  }
];
