const { readFile } = require("fs");
readFile('./package.json', (err, data) => {
    console.log('file');
});
setImmediate(() => {
    console.log(4);
})
setTimeout(() => {
    console.log(3);
});
process.nextTick(() => {
    console.log(1);
});
Promise.resolve().then(() => {
    console.log(2);
});
process.nextTick(() => {
    console.log(12);
});
setTimeout(() => {
    console.log(6);
});