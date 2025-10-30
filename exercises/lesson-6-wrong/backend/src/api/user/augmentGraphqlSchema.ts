import SchemaBuilder from '../../graphql/builder';

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const UserRef = builder.prismaObject('User', {
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      email: t.exposeString('email'),
      bankAccount: t.exposeString('bankAccount'),
    }),
  });
};

export default augmentSchema;
