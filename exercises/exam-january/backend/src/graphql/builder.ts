import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@/generated/pothos-prisma-types';
import { PrismaClient } from '@/generated/prisma/client';
import { GraphQLContext } from '@/types/graphQLContext';

const prisma = new PrismaClient();

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: GraphQLContext;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

export default builder;
