'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting product pairings based on past order data.
 *
 * The flow analyzes order history to identify products that are frequently purchased together and recommends
 * these pairings to POS users to increase order value and customer satisfaction.
 *
 * @exports `suggestProductPairings` - The main function to trigger the product pairing suggestion flow.
 * @exports `SuggestProductPairingsInput` - The input type for the suggestProductPairings function.
 * @exports `SuggestProductPairingsOutput` - The output type for the suggestProductPairings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductPairingsInputSchema = z.object({
  orderHistory: z.string().describe('A stringified JSON array of past order data, each order containing a list of product names.'),
  currentOrder: z.array(z.string()).describe('An array of product names in the current order.'),
  numberOfSuggestions: z.number().default(3).describe('The number of product pairing suggestions to return.'),
});
export type SuggestProductPairingsInput = z.infer<typeof SuggestProductPairingsInputSchema>;

const SuggestProductPairingsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of product names that are suggested to pair with the current order.'),
});
export type SuggestProductPairingsOutput = z.infer<typeof SuggestProductPairingsOutputSchema>;


export async function suggestProductPairings(input: SuggestProductPairingsInput): Promise<SuggestProductPairingsOutput> {
  return suggestProductPairingsFlow(input);
}

const suggestProductPairingsPrompt = ai.definePrompt({
  name: 'suggestProductPairingsPrompt',
  input: {schema: SuggestProductPairingsInputSchema},
  output: {schema: SuggestProductPairingsOutputSchema},
  prompt: `You are a point-of-sale (POS) system assistant designed to suggest product pairings to increase order value and customer satisfaction.

Analyze the past order data and identify products that are frequently purchased together. Consider the current order and suggest {{numberOfSuggestions}} additional products that would complement the existing items.

Past Order Data:
{{orderHistory}}

Current Order:
{{#each currentOrder}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggestions:
`,  
});

const suggestProductPairingsFlow = ai.defineFlow(
  {
    name: 'suggestProductPairingsFlow',
    inputSchema: SuggestProductPairingsInputSchema,
    outputSchema: SuggestProductPairingsOutputSchema,
  },
  async input => {
    const {output} = await suggestProductPairingsPrompt(input);
    return output!;
  }
);
