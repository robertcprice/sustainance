import { IncentiveMatch, GapResult } from './types';

interface IncentiveProgram {
  id: string;
  name: string;
  type: string;
  description: string;
  estimatedValue: string;
  eligibleIndustries: string;
  eligibleStates: string;
  eligibleFamilies: string;
  url: string;
  agency: string;
  deadlineInfo: string;
}

export function matchIncentives(
  programs: IncentiveProgram[],
  industry: string,
  state: string,
  gaps: GapResult[]
): IncentiveMatch[] {
  // Get unique family IDs from gaps that actually have gaps
  const gapFamilyIds = new Set(
    gaps.filter((g) => g.severity !== 'no_gap').map((g) => g.familyId)
  );

  return programs
    .filter((program) => {
      // Check industry match
      const eligibleIndustries = program.eligibleIndustries.split(',').map((s) => s.trim());
      const industryMatch = eligibleIndustries.includes('all') || eligibleIndustries.includes(industry);

      // Check state match
      const eligibleStates = program.eligibleStates.split(',').map((s) => s.trim());
      const stateMatch = eligibleStates.includes('all') || eligibleStates.includes(state);

      // Check family match - at least one gap family must overlap
      const eligibleFamilies = program.eligibleFamilies.split(',').map((s) => s.trim());
      const familyMatch = eligibleFamilies.some((f) => gapFamilyIds.has(f));

      return industryMatch && stateMatch && familyMatch;
    })
    .map((program) => {
      const eligibleFamilies = program.eligibleFamilies.split(',').map((s) => s.trim());
      const matchingFamilies = eligibleFamilies.filter((f) => gapFamilyIds.has(f));

      return {
        id: program.id,
        name: program.name,
        type: program.type,
        description: program.description,
        estimatedValue: program.estimatedValue,
        agency: program.agency,
        url: program.url,
        deadlineInfo: program.deadlineInfo,
        matchReason: `Addresses gaps in ${matchingFamilies.length} skill ${matchingFamilies.length === 1 ? 'family' : 'families'}`,
      };
    });
}
