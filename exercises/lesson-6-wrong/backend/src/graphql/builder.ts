import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '../../generated/pothos-prisma-types';
import { PrismaClient } from '../../generated/prisma';
import { GraphQLScalarType } from 'graphql';
import { resolvers } from 'graphql-scalars';
import { GraphQLContext } from '@/types/GraphQLContext';

const prisma = new PrismaClient();

const shouldImportScalar = (name: string) => ['Date', 'DateTime'].includes(name);

const allScalarTypes = Object.values(resolvers);
const filteredScalar = allScalarTypes.filter((type) => shouldImportScalar(type.name));
const scalarRegistry: Record<string, GraphQLScalarType> = {};
filteredScalar.forEach((scalar) => {
  scalarRegistry[scalar.name] = scalar;
});

type ScalarsMap = {
  [K in keyof typeof scalarRegistry]: { Input: unknown; Output: unknown };
};

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: ScalarsMap;
  Context: GraphQLContext;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

Object.entries(scalarRegistry).forEach(([name, resolver]) => builder.addScalarType(name, resolver));

export default builder;
