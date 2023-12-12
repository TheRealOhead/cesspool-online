module.exports = class SortedList {
	list = []; // Meant to be private

	constructor(comparisonFunction) {
		this.comparisonFunction = comparisonFunction || (a=>a);
	}

	add(parameter) {
		if (!!parameter.forEach) { // Check if iterable
			this.addFromIterable(parameter);
			return;
		}
		this.addSingleElement(parameter);
	}

	addSingleElement(element) {
		const index = this.searchWholeList(element).lastIndex;
		this.list = [...this.list.slice(0,index),element,...this.list.slice(index)]
	}

	addFromIterable(iterable) {
		if (!iterable.forEach) throw new Error(iterable + ' was expected to be iterable but has no forEach function');
		let sortedList = this; // We need to do this so we maintain a reference to the parent SortedList within the forEach
		iterable.forEach(element=>sortedList.addSingleElement(element));
	}

	removeElementAt(index) {
		this.list.splice(index,1);
	}

	removeElement(element) {
		this.removeElementAt(this.searchWholeList(element).lastIndex);
	}

	searchWholeList(element) {
		return this.search(element,0,this.list.length);
	}

	search(element,beginning,end) { // Meant to be private
		const midpoint = Math.floor((beginning + end) / 2);
		const pivotElement = this.list[midpoint];
		if (pivotElement == element)                                                  return {lastIndex: midpoint,  isPresent: true};
		if (beginning == midpoint)                                                    return {lastIndex: beginning, isPresent: false};
		if (this.comparisonFunction(element) < this.comparisonFunction(pivotElement)) return this.search(element, beginning, midpoint);
		if (this.comparisonFunction(element) > this.comparisonFunction(pivotElement)) return this.search(element, midpoint, end);
		throw new Error('Fatal error, reached end of search algorithm (that\'s not supposed to happen)');
	}

	includes(element) {
		return this.searchWholeList(element).isPresent;
	}
}