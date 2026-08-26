const Viz = {
  randomArray(n, min, max) {
    return Array.from({ length: n }, () => min + Math.floor(Math.random() * (max - min + 1)));
  },
  uniqueSorted(n, min, max) {
    const set = new Set();
    while (set.size < n) set.add(min + Math.floor(Math.random() * (max - min + 1)));
    return [...set].sort((a, b) => a - b);
  }
};

function bubbleSteps(input) {
  const a = [...input];
  const steps = [{ array: [...a], compare: [], swap: [], sortedFrom: a.length, msg: "Start. Adjacent pairs will be compared left to right." }];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push({
        array: [...a],
        compare: [j, j + 1],
        swap: [],
        sortedFrom: n - i,
        msg: `Compare A[${j}] = ${a[j]} and A[${j + 1}] = ${a[j + 1]}.`
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push({
          array: [...a],
          compare: [],
          swap: [j, j + 1],
          sortedFrom: n - i,
          msg: `Swap because ${a[j + 1]} was greater than ${a[j]}.`
        });
      }
    }
    if (!swapped) {
      steps.push({
        array: [...a],
        compare: [],
        swap: [],
        sortedFrom: 0,
        msg: "No swaps in this pass — the array is sorted. Early exit."
      });
      return steps;
    }
    steps.push({
      array: [...a],
      compare: [],
      swap: [],
      sortedFrom: n - 1 - i,
      msg: `Pass ${i + 1} complete. Largest remaining value is in place.`
    });
  }
  steps.push({ array: [...a], compare: [], swap: [], sortedFrom: 0, msg: "Finished. Array is sorted." });
  return steps;
}

function binarySteps(arr, target) {
  const steps = [];
  let low = 0;
  let high = arr.length - 1;
  steps.push({
    array: [...arr],
    low,
    high,
    mid: null,
    found: -1,
    msg: `Search for ${target} in a sorted array. low = ${low}, high = ${high}.`
  });
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps.push({
      array: [...arr],
      low,
      high,
      mid,
      found: -1,
      msg: `mid = ⌊(${low} + ${high}) / 2⌋ = ${mid}. A[mid] = ${arr[mid]}.`
    });
    if (arr[mid] === target) {
      steps.push({
        array: [...arr],
        low,
        high,
        mid,
        found: mid,
        msg: `A[mid] equals ${target}. Found at index ${mid}.`
      });
      return steps;
    }
    if (arr[mid] < target) {
      steps.push({
        array: [...arr],
        low,
        high,
        mid,
        found: -1,
        msg: `${arr[mid]} < ${target}, so discard the left half. New low = ${mid + 1}.`
      });
      low = mid + 1;
    } else {
      steps.push({
        array: [...arr],
        low,
        high,
        mid,
        found: -1,
        msg: `${arr[mid]} > ${target}, so discard the right half. New high = ${mid - 1}.`
      });
      high = mid - 1;
    }
  }
  steps.push({
    array: [...arr],
    low,
    high,
    mid: null,
    found: -1,
    msg: `low > high. ${target} is not in the array.`
  });
  return steps;
}

function mergeSteps(input) {
  const a = [...input];
  const steps = [{ array: [...a], hi: [], msg: "Start Merge Sort: divide into halves, then merge sorted runs." }];

  function merge(l, m, r) {
    const left = a.slice(l, m + 1);
    const right = a.slice(m + 1, r + 1);
    steps.push({
      array: [...a],
      hi: range(l, r),
      msg: `Merge sorted runs [${l}..${m}] and [${m + 1}..${r}].`
    });
    let i = 0;
    let j = 0;
    let k = l;
    while (i < left.length && j < right.length) {
      steps.push({
        array: [...a],
        hi: range(l, r),
        compare: [k],
        msg: `Compare ${left[i]} (left) and ${right[j]} (right). Write the smaller into index ${k}.`
      });
      if (left[i] <= right[j]) {
        a[k] = left[i++];
      } else {
        a[k] = right[j++];
      }
      steps.push({
        array: [...a],
        hi: range(l, r),
        swap: [k],
        msg: `Wrote ${a[k]} at index ${k}.`
      });
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      steps.push({ array: [...a], hi: range(l, r), swap: [k], msg: `Copy remaining left value ${a[k]} to index ${k}.` });
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      steps.push({ array: [...a], hi: range(l, r), swap: [k], msg: `Copy remaining right value ${a[k]} to index ${k}.` });
      k++;
    }
  }

  function sort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    steps.push({
      array: [...a],
      hi: range(l, r),
      msg: `Divide range [${l}..${r}] at mid = ${m}.`
    });
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  }

  sort(0, a.length - 1);
  steps.push({ array: [...a], hi: [], msg: "Finished. The full array is sorted." });
  return steps;
}

function range(l, r) {
  const out = [];
  for (let i = l; i <= r; i++) out.push(i);
  return out;
}

function renderBars(container, step, maxVal) {
  const max = maxVal || Math.max(...step.array, 1);
  const compare = new Set(step.compare || []);
  const swap = new Set(step.swap || []);
  const hi = new Set(step.hi || []);
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "bars";
  step.array.forEach((v, i) => {
    const b = document.createElement("div");
    b.className = "bar";
    b.style.height = `${Math.max(18, (v / max) * 160)}px`;
    b.textContent = v;
    if (step.sortedFrom != null && i >= step.sortedFrom) b.classList.add("sorted");
    if (hi.has(i)) b.classList.add("range");
    if (compare.has(i)) b.classList.add("compare");
    if (swap.has(i)) b.classList.add("swap");
    if (step.mid === i) b.classList.add("mid");
    if (step.low === i) b.classList.add("low");
    if (step.high === i) b.classList.add("high");
    if (step.found === i) b.classList.add("found");
    wrap.appendChild(b);
  });
  container.appendChild(wrap);
  const cap = document.createElement("div");
  cap.className = "caption";
  cap.textContent = step.msg || "";
  container.appendChild(cap);
}
