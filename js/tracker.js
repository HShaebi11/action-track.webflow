// action:Track - Subscription & Spending Tracker logic

(function () {
	"use strict";

	// Element references
	const inputMonthlyIncome = document.getElementById("monthly-income");
	const inputName = document.getElementById("cost-name");
	const inputDay = document.getElementById("day");
	const inputCost = document.getElementById("cost");
	const inputNote = document.getElementById("note");
	const btnMonthly = document.getElementById("option-monthly");
	const btnOneTime = document.getElementById("option-one-time");
	const btnPriorityHigh = document.getElementById("option-High");
	const btnPriorityMedium = document.getElementById("option-Medium");
	const btnPriorityLow = document.getElementById("option-Low");
	const btnConfirm = document.getElementById("confirm-btn");
	const btnAddSubscription = document.getElementById("add-subscription-btn");
	const tableBody = document.getElementById("subscriptions-body");
	const totalEl = document.getElementById("total");
	const remainingNumberEl = document.getElementById("remaining-number");
	const remainingPercentEl = document.getElementById("remaining-percent");

	// App state
	let selectedFrequency = "monthly"; // "monthly" | "one-time"
	let selectedPriority = "Medium"; // High | Medium | Low
	let subscriptions = []; // array of { id, name, day, cost, frequency, note, priority }

	// Helpers
	function setActive(element, isActive) {
		if (!element) return;
		if (isActive) {
			element.classList.remove("in-active");
			element.classList.add("active");
		} else {
			element.classList.remove("active");
			element.classList.add("in-active");
		}
	}

	function money(number) {
		const value = isFinite(number) ? Number(number) : 0;
		return `£${value.toFixed(2)}`;
	}

	function percent(value) {
		const v = isFinite(value) ? Number(value) : 0;
		return `%${v.toFixed(2)}`;
	}

	function restoreState() {
		try {
			const raw = localStorage.getItem("actionTrackState");
			if (!raw) return;
			const state = JSON.parse(raw);
			inputMonthlyIncome.value = state.monthlyIncome ?? "";
			subscriptions = Array.isArray(state.subscriptions) ? state.subscriptions : [];
			selectedFrequency = state.selectedFrequency || "monthly";
			selectedPriority = state.selectedPriority || "Medium";
		} catch (e) {
			console.warn("Failed to restore state", e);
		}
	}

	function persistState() {
		try {
			const state = {
				monthlyIncome: inputMonthlyIncome.value,
				subscriptions,
				selectedFrequency,
				selectedPriority,
			};
			localStorage.setItem("actionTrackState", JSON.stringify(state));
		} catch (e) {
			console.warn("Failed to persist state", e);
		}
	}

	function recompute() {
		// Monthly total: monthly items + pro-rated one-time items this month (treat as 0 unless desired)
		const monthlyTotal = subscriptions.reduce((sum, s) => {
			if (s.frequency === "monthly") return sum + s.cost;
			return sum; // one-time not included in monthly spend
		}, 0);

		const income = Number(inputMonthlyIncome.value || 0);
		const remaining = income - monthlyTotal;
		const remainingPct = income > 0 ? (remaining / income) * 100 : 0;

		if (totalEl) totalEl.textContent = money(monthlyTotal);
		if (remainingNumberEl) remainingNumberEl.textContent = money(remaining);
		if (remainingPercentEl) remainingPercentEl.textContent = percent(remainingPct);
	}

	function renderTable() {
		if (!tableBody) return;
		// Clear existing rows
		tableBody.innerHTML = "";
		// Render each subscription
		for (const item of subscriptions) {
			const row = document.createElement("tr");
			row.className = "fs-table_row";

			const tdName = document.createElement("td");
			tdName.className = "fs-table_cell";
			tdName.textContent = item.name;

			const tdCost = document.createElement("td");
			tdCost.className = "fs-table_cell";
			tdCost.textContent = money(item.cost);

			const tdFreq = document.createElement("td");
			tdFreq.className = "fs-table_cell";
			tdFreq.textContent = item.frequency;

			const tdNote = document.createElement("td");
			tdNote.className = "fs-table_cell";
			tdNote.textContent = item.note || "";

			const tdPriority = document.createElement("td");
			tdPriority.className = "fs-table_cell";
			tdPriority.textContent = item.priority;

			const tdRemove = document.createElement("td");
			tdRemove.className = "fs-table_cell";
			const removeBtn = document.createElement("div");
			removeBtn.className = "button in-active";
			removeBtn.textContent = "remove";
			removeBtn.addEventListener("click", () => {
				subscriptions = subscriptions.filter((s) => s.id !== item.id);
				persistState();
				renderTable();
				recompute();
			});
			tdRemove.appendChild(removeBtn);

			row.appendChild(tdName);
			row.appendChild(tdCost);
			row.appendChild(tdFreq);
			row.appendChild(tdNote);
			row.appendChild(tdPriority);
			row.appendChild(tdRemove);

			tableBody.appendChild(row);
		}
	}

	function wireFrequencyToggles() {
		function update() {
			setActive(btnMonthly, selectedFrequency === "monthly");
			setActive(btnOneTime, selectedFrequency === "one-time");
			persistState();
		}
		if (btnMonthly) {
			btnMonthly.addEventListener("click", () => {
				selectedFrequency = "monthly";
				update();
			});
		}
		if (btnOneTime) {
			btnOneTime.addEventListener("click", () => {
				selectedFrequency = "one-time";
				update();
			});
		}
		update();
	}

	function wirePriorityToggles() {
		function update() {
			setActive(btnPriorityHigh, selectedPriority === "High");
			setActive(btnPriorityMedium, selectedPriority === "Medium");
			setActive(btnPriorityLow, selectedPriority === "Low");
			persistState();
		}
		if (btnPriorityHigh) btnPriorityHigh.addEventListener("click", () => { selectedPriority = "High"; update(); });
		if (btnPriorityMedium) btnPriorityMedium.addEventListener("click", () => { selectedPriority = "Medium"; update(); });
		if (btnPriorityLow) btnPriorityLow.addEventListener("click", () => { selectedPriority = "Low"; update(); });
		update();
	}

	function addSubscriptionFromInputs() {
		const name = (inputName.value || "").trim();
		const day = Number(inputDay.value || 0);
		const cost = Number(inputCost.value || 0);
		const note = (inputNote.value || "").trim();
		if (!name || !isFinite(cost) || cost <= 0) {
			return; // minimal validation
		}
		const item = {
			id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			name,
			day,
			cost,
			frequency: selectedFrequency,
			note,
			priority: selectedPriority,
		};
		subscriptions.push(item);
		persistState();
		renderTable();
		recompute();
		// clear minimal fields except toggles
		inputName.value = "";
		inputDay.value = "";
		inputCost.value = "";
		inputNote.value = "";
	}

	function wireButtons() {
		if (btnConfirm) btnConfirm.addEventListener("click", addSubscriptionFromInputs);
		if (btnAddSubscription) btnAddSubscription.addEventListener("click", addSubscriptionFromInputs);
		const submitOnEnter = (el) => {
			if (!el) return;
			el.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					addSubscriptionFromInputs();
				}
			});
		};
		submitOnEnter(inputName);
		submitOnEnter(inputDay);
		submitOnEnter(inputCost);
		submitOnEnter(inputNote);
	}

	function wireIncome() {
		if (!inputMonthlyIncome) return;
		inputMonthlyIncome.addEventListener("input", () => {
			persistState();
			recompute();
		});
	}

	function init() {
		restoreState();
		wireFrequencyToggles();
		wirePriorityToggles();
		wireButtons();
		wireIncome();
		renderTable();
		recompute();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
		window.addEventListener("load", () => { renderTable(); recompute(); });
	} else {
		init();
		window.addEventListener("load", () => { renderTable(); recompute(); });
	}
})();

