import builder from "./builder";
import augmentExpenseSchema from "../api/expense/augmentGraphqlSchema";
import augmentUserSchema from "../api/user/augmentGraphqlSchema";
import augmentReportSchema from "../api/report/augmentGraphqlSchema";

augmentExpenseSchema(builder);
augmentUserSchema(builder);
augmentReportSchema(builder);

const schema = builder.toSchema();
export default schema;
