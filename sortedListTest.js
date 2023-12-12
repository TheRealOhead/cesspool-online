const SortedList = require('./sortedList.js');

function assert(bool) {
	if (!bool) throw new Error('Test failed');
}

function testAdding() {
	let list = new SortedList(a=>{return a});
	list.add([87,9,2,21,99]);
	assert(list.list[0] == 2);
}

function testFinding() {
	let list = new SortedList(a=>{return a});
	list.add([87,9,2,21,99]);
	assert(list.includes(99));
	assert(!list.includes(14));
}

function testRemoving() {
	let list = new SortedList(a=>{return a});
	list.add([87,9,2,21,99]);
	list.removeElement(9);
	assert(!list.includes(9));	
}

testAdding();
testFinding();
testRemoving();