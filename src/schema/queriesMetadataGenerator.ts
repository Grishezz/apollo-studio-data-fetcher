import { DocumentNode, ListTypeNode, NonNullTypeNode, ObjectTypeDefinitionNode, TypeNode } from 'graphql/language/ast';

const { parse, visit, print } = require('graphql');
const fs = require('fs');

export function generateQueriesMetadata() {
  const graphqlSchema = fs.readFileSync('./data/schema.graphql', 'utf8');
  const schema: DocumentNode = parse(graphqlSchema);
  const queriesMetadata: Record<string, QueryMetadata> = buildQueryMetaData(schema);
  addTypesMetadata(schema, queriesMetadata);
  return queriesMetadata;
}

function buildQueryMetaData(schema: DocumentNode): Record<string, QueryMetadata> {
  const queriesMetadata: Record<string, QueryMetadata> = {};
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node: ObjectTypeDefinitionNode) {
        const typeName = node.name.value;
        if (typeName === 'Query') {
          node.fields?.forEach((field) => {
            queriesMetadata[field.name.value] = {
              query: field.name.value,
              type: print(field.type),
              underlyingType: print(unwrapType(field.type))
            };
          });
        }
        return node;
      }
    }
  });
  return queriesMetadata;
}

function addTypesMetadata(schema: DocumentNode, queriesMetadata: Record<string, QueryMetadata>) {
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node: ObjectTypeDefinitionNode) {
        const typeName = node.name.value;
        Object.values(queriesMetadata)
          .filter((queryMetadata) => queryMetadata.underlyingType === typeName)
          .forEach((queryMetadata) => {
            // eslint-disable-next-line no-param-reassign
            queryMetadata.fields = node.fields?.map((field) => ({
              field: field.name.value,
              type: print(field.type)
            }));
          });
        return node;
      }
    }
  });
}

function unwrapType(gqlType: TypeNode): TypeNode {
  if (['NonNullType', 'ListType'].includes(gqlType.kind)) {
    return unwrapType((<NonNullTypeNode | ListTypeNode>gqlType).type);
  }
  return gqlType;
}

export interface QueryMetadata {
  query: string;
  type: string;
  underlyingType: string;
  fields?: Array<{ field: string; type: string }>;
}
