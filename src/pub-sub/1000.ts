import Store from './store/store';
import Customer from './customer/customer';

const store = new Store('chinese resturant', {
    managerCount: 100
});

let customers = [];
for (let i = 0; i < 5001; i ++) {
    customers.push(new Customer(`c-${i+1}`));
}
let _ = setInterval(() => {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
}, 1000);
console.time();
Promise.all(customers.map(c => c.purchase({
    bound_user: c.name,
    content: { dumpling: 2 }
}, store))).then(result => {
    // console.log(result);
    console.timeEnd();
    clearInterval(_);
})

