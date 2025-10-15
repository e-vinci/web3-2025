import builder from './builder';
import augmentExpenseSchema from '../api/expense/augmentGraphqlSchema';
import augmentUserSchema from '../api/user/augmentGraphqlSchema';

augmentExpenseSchema(builder);
augmentUserSchema(builder);

const schema = builder.toSchema();
export default schema;
