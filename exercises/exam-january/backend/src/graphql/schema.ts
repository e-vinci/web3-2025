import builder from './builder';
import augmentExpenseSchema from '../api/expense/augmentGraphqlSchema';
import augmentUserSchema from '../api/user/augmentGraphqlSchema';
import augmentCommentSchema from '../api/comment/augmentGraphqlSchema';

augmentExpenseSchema(builder);
augmentUserSchema(builder);
augmentCommentSchema(builder);

const schema = builder.toSchema();
export default schema;
