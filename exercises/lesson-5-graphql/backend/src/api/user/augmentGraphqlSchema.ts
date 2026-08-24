import { PrismaClient, Transfer } from '../../../generated/prisma';
import SchemaBuilder from '../../graphql/builder';

const prisma = new PrismaClient();

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const UserRef = builder.prismaObject('User', {
    fields: (t) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      email: t.exposeString('email'),
      bankAccount: t.exposeString('bankAccount'),
    }),
  });

  const TransferRef = builder.prismaObject('Transfer', {
    fields: (t) => ({
      id: t.exposeID('id'),
      amount: t.exposeFloat('amount'),
      date: t.string({
        resolve: (transfer: Transfer) => transfer.date.toISOString(),
      }),
      source: t.relation('source'),
      target: t.relation('target'),
    }),
  });

  builder.mutationType({
    fields: (t) => ({
      createTransfer: t.field({
        type: TransferRef,
        args: {
          amount: t.arg.string({ required: true }),
          sourceId: t.arg.string({ required: true }),
          targetId: t.arg.string({ required: true }),
          date: t.arg.string(),
        },
        resolve: async (_root, args) => {
          const parsedAmount = parseFloat(args.amount as string);
          const parsedSourceId = Number(args.sourceId as string);
          const parsedTargetId = Number(args.targetId as string);
          const parsedDate = args.date ? new Date(args.date as string) : new Date();

          return prisma.transfer.create({
            data: {
              amount: parsedAmount,
              date: parsedDate,
              source: { connect: { id: parsedSourceId } },
              target: { connect: { id: parsedTargetId } },
            },
          });
        },
      }),
    }),
  });
};

export default augmentSchema;
