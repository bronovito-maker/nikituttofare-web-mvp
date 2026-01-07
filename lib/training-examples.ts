// lib/training-examples.ts
import trainingSeed from '../training_data_seed.json';
import simulatedUsers from '../simulated_users.json';

type TrainingExample = {
  category?: string;
  urgency?: string;
  user_type?: string;
  text: string;
  expected_action?: string;
};

const SEED_EXAMPLES: TrainingExample[] = Array.isArray(trainingSeed) ? (trainingSeed as TrainingExample[]) : [];
const SIMULATED_EXAMPLES: TrainingExample[] = Array.isArray(simulatedUsers) ? (simulatedUsers as TrainingExample[]) : [];

/**
 * Costruisce un contesto compatto di esempi reali da seed e simulated users.
 * Limita gli esempi per non gonfiare il prompt.
 */
export function buildExamplesContext(maxExamples = 15): string {
  const combined = [...SEED_EXAMPLES, ...SIMULATED_EXAMPLES].slice(0, Math.max(0, maxExamples));

  if (combined.length === 0) return '';

  const lines = combined.map((ex, idx) => {
    const cat = ex.category ? `cat:${ex.category}` : 'cat:nd';
    const urg = ex.urgency ? `urg:${ex.urgency}` : 'urg:nd';
    const utype = ex.user_type ? `user:${ex.user_type}` : 'user:nd';
    const action = ex.expected_action ? ` → azione: ${ex.expected_action}` : '';
    return `${idx + 1}. [${cat} | ${urg} | ${utype}] "${ex.text}"${action ? ` ${action}` : ''}`;
  });

  return [
    '📚 CASI DI RIFERIMENTO (estratti da seed + simulated users)',
    ...lines,
  ].join('\n');
}
