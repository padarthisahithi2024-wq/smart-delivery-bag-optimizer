
let packages = [];
let capacity = 0;
let results = {};
let currentAlgorithm = "brute";

// Load sample packages
function loadExample() {
    document.getElementById("capacity").value = 10;

    document.getElementById("packages").value =
`Laptop, 5, 100
Books, 4, 90
Food, 3, 70
Clothes, 2, 40`;

    document.getElementById("error").textContent = "";
}

// Validate and read the input
function validateInput() {
    const capacityText =
        document.getElementById("capacity").value.trim();

    const packageText =
        document.getElementById("packages").value.trim();

    if (capacityText === "" || packageText === "") {
        throw new Error("Please enter bag capacity and package details.");
    }

    capacity = Number(capacityText);

    if (!Number.isSafeInteger(capacity) ||
        capacity < 1 || capacity > 5000) {
        throw new Error("Capacity must be a whole number between 1 and 5000.");
    }

    const lines = packageText.split("\n");

    if (lines.length > 20) {
        throw new Error("Please enter no more than 20 packages.");
    }

    packages = lines.map((line, index) => {
        const parts = line.split(",").map(item => item.trim());

        if (parts.length !== 3) {
            throw new Error(
                `Line ${index + 1}: Use Name, Weight, Value format.`
            );
        }

        const name = parts[0];
        const weight = Number(parts[1]);
        const value = Number(parts[2]);

        if (!name) {
            throw new Error(`Line ${index + 1}: Package name is missing.`);
        }

        if (!Number.isSafeInteger(weight) || weight <= 0) {
            throw new Error(
                `Line ${index + 1}: Weight must be a positive whole number.`
            );
        }

        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error(
                `Line ${index + 1}: Value must be a non-negative whole number.`
            );
        }

        return { name, weight, value };
    });

    return true;
}

// Helper to calculate selected package totals
function makeResult(selected, operations, steps) {
    let totalWeight = 0;
    let totalValue = 0;

    selected.forEach(index => {
        totalWeight += packages[index].weight;
        totalValue += packages[index].value;
    });

    return {
        selected,
        totalWeight,
        totalValue,
        operations,
        steps
    };
}

// APPROACH 1: BRUTE FORCE
function bruteForce() {
    const n = packages.length;
    const totalCombinations = 2 ** n;

    let bestValue = 0;
    let bestSelection = [];
    let operations = 0;
    let steps = [];

    for (let mask = 0; mask < totalCombinations; mask++) {
        let weight = 0;
        let value = 0;
        let selected = [];

        for (let i = 0; i < n; i++) {
            operations++;

            if ((mask & (1 << i)) !== 0) {
                weight += packages[i].weight;
                value += packages[i].value;
                selected.push(i);
            }
        }

        if (weight <= capacity && value > bestValue) {
            bestValue = value;
            bestSelection = selected;

            if (steps.length < 6) {
                steps.push(
                    `A better combination was found with value ${value} and weight ${weight} kg.`
                );
            }
        }
    }

    steps.push(
        `Checked all ${totalCombinations} possible package combinations.`
    );

    return makeResult(bestSelection, operations, steps);
}

// APPROACH 2: GREEDY
function greedy() {
    const sorted = packages
        .map((item, index) => ({
            ...item,
            originalIndex: index,
            ratio: item.value / item.weight
        }))
        .sort((a, b) => b.ratio - a.ratio);

    let selected = [];
    let totalWeight = 0;
    let operations = 0;
    let steps = [];

    for (const item of sorted) {
        operations++;

        if (totalWeight + item.weight <= capacity) {
            selected.push(item.originalIndex);
            totalWeight += item.weight;

            steps.push(
                `Selected ${item.name}: value-to-weight ratio ${item.ratio.toFixed(2)}.`
            );
        } else {
            steps.push(
                `Skipped ${item.name}: it does not fit in the remaining capacity.`
            );
        }
    }

    return makeResult(selected, operations, steps);
}

// APPROACH 3: DYNAMIC PROGRAMMING
function dynamicProgramming() {
    const n = packages.length;

    const dp = Array.from(
        { length: n + 1 },
        () => Array(capacity + 1).fill(0)
    );

    let operations = 0;
    let steps = [];

    for (let i = 1; i <= n; i++) {
        const item = packages[i - 1];

        for (let w = 0; w <= capacity; w++) {
            operations++;

            // Do not select the current package
            dp[i][w] = dp[i - 1][w];

            // Select it if it fits and gives more value
            if (item.weight <= w) {
                const includeValue =
                    item.value + dp[i - 1][w - item.weight];

                dp[i][w] = Math.max(
                    dp[i][w],
                    includeValue
                );
            }
        }

        steps.push(
            `Processed ${item.name} and updated the optimization table.`
        );
    }

    // Reconstruct the selected packages
    let selected = [];
    let remainingCapacity = capacity;

    for (let i = n; i > 0; i--) {
        if (dp[i][remainingCapacity] !==
            dp[i - 1][remainingCapacity]) {

            selected.push(i - 1);
            remainingCapacity -= packages[i - 1].weight;
        }
    }

    selected.reverse();

    steps.push(
        `The table gives the maximum possible value: ${dp[n][capacity]}.`
    );

    return makeResult(selected, operations, steps);
}

// APPROACH 4: BACKTRACKING
function backtracking() {
    let bestValue = 0;
    let bestSelection = [];
    let operations = 0;
    let steps = [];

    function explore(index, weight, value, selected) {
        operations++;

        // Prune choices that exceed bag capacity
        if (weight > capacity) {
            if (steps.length < 8) {
                steps.push("Pruned a combination because it exceeded capacity.");
            }
            return;
        }

        // All packages have been considered
        if (index === packages.length) {
            if (value > bestValue) {
                bestValue = value;
                bestSelection = [...selected];

                if (steps.length < 8) {
                    steps.push(
                        `Found a better valid selection with value ${value}.`
                    );
                }
            }
            return;
        }

        const item = packages[index];

        // Choice 1: Include the package
        selected.push(index);

        explore(
            index + 1,
            weight + item.weight,
            value + item.value,
            selected
        );

        // Choice 2: Exclude the package
        selected.pop();

        explore(
            index + 1,
            weight,
            value,
            selected
        );
    }

    explore(0, 0, 0, []);

    steps.push(
        "Explored include/exclude choices and pruned overweight combinations."
    );

    return makeResult(bestSelection, operations, steps);
}

// Run all four approaches
function runAllAlgorithms() {
    const error = document.getElementById("error");
    error.textContent = "";

    try {
        validateInput();

        results = {
            brute: bruteForce(),
            greedy: greedy(),
            dp: dynamicProgramming(),
            backtracking: backtracking()
        };

        showAlgorithm("brute");

    } catch (err) {
        error.textContent = err.message;

        document.getElementById("result").textContent =
            "Please correct the input and try again.";
    }
}

// Prevent HTML from being inserted through package names
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Display the selected algorithm
function showAlgorithm(name) {
    currentAlgorithm = name;

    document.querySelectorAll(".tab").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById("tab-" + name).classList.add("active");

    if (!results[name]) {
        document.getElementById("result").textContent =
            "Enter package details and click Optimize Packages.";
        return;
    }

    const information = {
        brute: {
            title: "Brute Force",
            time: "O(n × 2ⁿ)",
            space: "O(n)",
            explanation:
                "Checks every possible combination and chooses the one with maximum value.",
            optimal: "Yes, finds the exact optimal solution."
        },

        greedy: {
            title: "Greedy Algorithm",
            time: "O(n log n)",
            space: "O(n)",
            explanation:
                "Sorts packages by value-to-weight ratio and selects the best ratio first whenever the package fits.",
            optimal: "Not always. It may miss the best combination."
        },

        dp: {
            title: "Dynamic Programming",
            time: "O(n × W)",
            space: "O(n × W)",
            explanation:
                "Builds a table of the best values for different package counts and capacities.",
            optimal: "Yes, finds the exact optimal solution."
        },

        backtracking: {
            title: "Backtracking",
            time: "O(2ⁿ) worst case",
            space: "O(n)",
            explanation:
                "Explores choices to include or exclude each package and stops exploring a branch when it exceeds capacity.",
            optimal: "Yes, finds the exact optimal solution."
        }
    };

    const info = information[name];
    const result = results[name];

    let selectedNames = result.selected.map(
        index => escapeHTML(packages[index].name)
    );

    let packageList = selectedNames.length
        ? selectedNames.join(", ")
        : "No packages selected";

    let output = `
        <h3>${info.title}</h3>

        <p>${info.explanation}</p>

        <div class="result-grid">
            <div class="result-card">
                <strong>Total Value</strong>
                ${result.totalValue}
            </div>

            <div class="result-card">
                <strong>Total Weight</strong>
                ${result.totalWeight} kg
            </div>

            <div class="result-card">
                <strong>Operations / States</strong>
                ${result.operations}
            </div>
        </div>

        <h4>Selected Packages</h4>
        <p class="success">${packageList}</p>

        <p><strong>Bag Capacity:</strong> ${capacity} kg</p>

        <p><strong>Time Complexity:</strong> ${info.time}</p>

        <p><strong>Space Complexity:</strong> ${info.space}</p>

        <p class="${name === "greedy" ? "warning" : "success"}">
            ${info.optimal}
        </p>

        <h4>Step-by-Step Explanation</h4>
        <ol>
    `;

    result.steps.forEach(step => {
        output += `<li>${escapeHTML(step)}</li>`;
    });

    output += `</ol>`;

    document.getElementById("result").innerHTML = output;
}

// Load example when the page opens
loadExample();
