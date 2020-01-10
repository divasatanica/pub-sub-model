import Store from './store/store';
import Customer from './customer/customer';

const store = new Store('chinese resturant', {
    managerCount: 5
});
// let c1 = new Customer('coma');
// let c2 = new Customer('ak');
// let c3 = new Customer('kk');
// let c4 = new Customer('mn');
// let c5 = new Customer('nn');
let customers = [];
for (let i = 0; i < 10; i ++) {
    customers.push(new Customer(`c-${i+1}`));
}
console.time();
Promise.all(/*[
    c1.purchase({
        bound_user: c1.name,
        content: { 'apple': 2, 'pear': 3 }
    }, store),
    c2.purchase({
        bound_user: c2.name,
        content: { 'apple': 1, 'dumpling': 1 }
    }, store),
    c3.purchase({
        bound_user: c3.name,
        content: { 'dumpling': 1 } 
    }, store),
    c4.purchase({
        bound_user: c4.name,
        content: { 'dumpling': 1 }
    }, store),
    c5.purchase({
        bound_user: c5.name,
        content: { 'pear': 2 }
    }, store),
]*/customers.map(c => c.purchase({
    bound_user: c.name,
    content: { dumpling: 2 }
}, store))).then(result => {
    console.log(result);
    console.timeEnd();
})

