/**
 * Logger utility for data processing operations
 * Provides consistent logging with colors and timestamps
 */
export class ProcessingLogger {
	/**
	 * Log an informational message
	 * @param {string} message - Message to log
	 */
	static info(message) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.log(`\x1b[34m[${timestamp}] ℹ️  ${message}\x1b[0m`);
	}

	/**
	 * Log a successful operation
	 * @param {string} message - Success message
	 */
	static success(message) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.log(`\x1b[32m[${timestamp}] ✅ ${message}\x1b[0m`);
	}

	/**
	 * Log an error message
	 * @param {string} message - Error message
	 * @param {Error} [error] - Optional error object
	 */
	static error(message, error = null) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.error(`\x1b[31m[${timestamp}] ❌ ${message}\x1b[0m`);
		if (error) {
			console.error(`\x1b[31m    ${error.message}\x1b[0m`);
			if (error.stack) {
				console.error(`\x1b[90m    ${error.stack}\x1b[0m`);
			}
		}
	}

	/**
	 * Log a warning message
	 * @param {string} message - Warning message
	 */
	static warn(message) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.warn(`\x1b[33m[${timestamp}] ⚠️  ${message}\x1b[0m`);
	}

	/**
	 * Log a processing step completion
	 * @param {string} step - Name of the processing step
	 * @param {number} count - Number of items processed
	 */
	static logStep(step, count) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.log(`\x1b[36m[${timestamp}] 📊 Processed ${count} ${step}\x1b[0m`);
	}

	/**
	 * Log a debug message (only in debug mode)
	 * @param {string} message - Debug message
	 */
	static debug(message) {
		if (process.env.DEBUG === "true") {
			const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
			console.log(`\x1b[90m[${timestamp}] 🐛 ${message}\x1b[0m`);
		}
	}

	/**
	 * Log processing statistics
	 * @param {Object} stats - Statistics object
	 * @param {number} stats.totalItems - Total items processed
	 * @param {number} stats.duration - Processing duration in ms
	 * @param {number} stats.itemsPerSecond - Items processed per second
	 */
	static stats(stats) {
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
		console.log(
			`\x1b[35m[${timestamp}] 📈 Stats: ${stats.totalItems} items in ${stats.duration}ms (${stats.itemsPerSecond.toFixed(2)} items/sec)\x1b[0m`,
		);
	}

	/**
	 * Create a timer for measuring processing duration
	 * @param {string} label - Timer label
	 * @returns {Object} Timer object with stop method
	 */
	static startTimer(label) {
		const start = Date.now();
		this.info(`Starting ${label}...`);

		return {
			stop: () => {
				const duration = Date.now() - start;
				this.success(`${label} completed in ${duration}ms`);
				return duration;
			},
		};
	}

	/**
	 * Log a progress update
	 * @param {number} current - Current progress
	 * @param {number} total - Total items
	 * @param {string} label - Progress label
	 */
	static progress(current, total, label) {
		const percentage = Math.round((current / total) * 100);
		const progressBar =
			"█".repeat(Math.round(percentage / 5)) + "░".repeat(20 - Math.round(percentage / 5));
		const timestamp = new Date().toISOString().split("T")[1].split(".")[0];

		// Use \r to overwrite the same line
		process.stdout.write(
			`\r\x1b[36m[${timestamp}] 📊 ${label}: [${progressBar}] ${percentage}% (${current}/${total})\x1b[0m`,
		);

		// Add newline when complete
		if (current === total) {
			console.log("");
		}
	}
}
