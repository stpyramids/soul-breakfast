import { ArchetypeID, MonsterFormation } from "../monster";
import { R, Roll } from "../utils";

function solo(arch: ArchetypeID, roll: Roll, danger: number): MonsterFormation {
  return {
    appearing: [[arch, roll]],
    danger,
  };
}

export const MonsterFormations: MonsterFormation[] = [
  /// Vermin groups
  solo("maggot heap", R(1, 4, 3), 1),
  solo("gnat swarm", R(2, 4, 0), 1),
  solo("luminous grub", R(1, 3, 1), 5),
  solo("soul butterfly", R(1, 3, 1), 10),
  solo("torpid ghost", R(1, 1, 0), 10),
  /// Monster groups
  solo("dusty rat", R(1, 3, 0), 1),
  solo("crypt spider", R(1, 2, 0), 3),
  solo("little ghost", R(1, 1, 0), 4),
  solo("bleary eye", R(1, 1, 0), 5),
  {
    appearing: [
      ["dusty rat", R(2, 2, 1)],
      ["hungry rat", R(1, 3, 0)],
    ],
    danger: 7,
  },
  solo("knocker", R(1, 1, 0), 7),
  solo("wolf spider", R(1, 1, 0), 8),
  solo("weeping ghost", R(1, 1, 0), 10),
  solo("peering eye", R(1, 1, 0), 12),
  solo("howling ghost", R(1, 1, 0), 12),
  {
    appearing: [
      ["little ghost", R(2, 2, 1)],
      ["weeping ghost", R(1, 3, 0)],
      ["howling ghost", R(1, 1, 0)],
      ["torpid ghost", R(1, 4, 1)],
    ],
    danger: 12,
  },
  solo("gimlet eye", R(1, 1, 0), 15),
  solo("ambush spider", R(1, 1, 0), 15),
  solo("howling ghost", R(1, 3, 1), 17),
  {
    appearing: [
      ["dusty rat", R(2, 2, 1)],
      ["hungry rat", R(1, 3, 0)],
    ],
    danger: 7,
  },
  solo("wolf spider", R(1, 1, 0), 8),
  solo("weeping ghost", R(1, 1, 0), 10),
  solo("peering eye", R(1, 1, 0), 12),
  solo("howling ghost", R(1, 1, 0), 12),
  {
    appearing: [
      ["luminous grub", R(2, 2, 2)],
      ["soul butterfly", R(2, 3, 1)],
      ["soul sucker", R(1, 2, 0)],
    ],
    danger: 15,
  },
  solo("soul sucker", R(2, 2, 2), 17),

  /// Do-gooder parties
  {
    appearing: [
      ["do-gooder", R(1, 2, 0)],
      ["acolyte", R(1, 2, -1)],
    ],
    danger: 9,
  },
  {
    appearing: [
      ["warrior", R(1, 1, 0)],
      ["acolyte", R(1, 1, 0)],
    ],
    danger: 12,
  },
  {
    appearing: [
      ["do-gooder", R(2, 2, 0)],
      ["warrior", R(1, 2, 0)],
    ],
    danger: 15,
  },
  {
    appearing: [["warrior", R(2, 2, 1)]],
    danger: 20,
  },
  {
    appearing: [
      ["warrior", R(1, 2, 0)],
      ["priest", R(1, 1, 0)],
    ],
    danger: 20,
  },
  {
    appearing: [
      ["do-gooder", R(2, 2, 0)],
      ["warrior", R(1, 2, 0)],
      ["priest", R(1, 1, 0)],
    ],
    danger: 25,
  },
];
