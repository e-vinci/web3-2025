import type SchemaBuilder from '../../graphql/builder';

const augmentSchema = (builder: typeof SchemaBuilder) => {
  // Define User type
  builder.prismaObject('User', {
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      email: t.exposeString('email'),
      bankAccount: t.exposeString('bankAccount', { nullable: true }),
    }),
  });
};

export default augmentSchema;
