var z = require('zod');
var schema = z.object({
  name: z.string(),
  age: z.number().min(0).max(120),
  email: z.string().email(),
});

var valid = schema.safeParse({
  name: 'Alice',
  age: 30,
  email: 'alice@example.com',
});

console.log(valid);
// console.log(valid.data);

// var invalid = schema.safeParse({
//   name: 'Jeane',
//   age: 144,
//   email: 'alice@example',
// });

// console.log(invalid);
// console.log(invalid.success);
// console.log(invalid.error.errors);
