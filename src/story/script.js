// All story wording in one place: codes, form values, captions, inspect cards and outcomes.
// Figures are illustrative.

export const CODES = { wrong: '08051020', right: '08051022' };

export const VOYAGE = { from: 'Florida', to: 'Southampton', days: 10 };   // illustrative

export const FORM = [
  { id: 'type', label: 'Declaration type', value: 'Import · release for free circulation' },
  { id: 'eori', label: 'Importer EORI', value: 'GB205671948000' },
  { id: 'exporter', label: 'Exporter', value: 'Sunrise Citrus Co., Florida, USA' },
  { id: 'goods', label: 'Goods description', value: 'Fresh navel oranges' },
  { id: 'origin', label: 'Country of origin', value: 'US · United States' },
  { id: 'code', label: 'Commodity code', value: CODES.wrong, code: true },
  { id: 'mass', label: 'Net mass', value: '18,600 kg' },
  { id: 'port', label: 'Port of arrival', value: 'Southampton' },
];

export const CHAPTERS = [
  { id: 'prepare', mark: '1', label: 'Preparing' },
  { id: 'journey', mark: '2', label: 'The journey' },
  { id: 'a', mark: 'A', label: 'Current system' },
  { id: 'b', mark: 'B', label: 'With checks' },
];

export const LINES = {
  prepare: {
    intro: 'She runs a small fruit import business in the UK. Today she’s ordering a container of fresh navel oranges from Florida.',
    docs: 'She arranges the shipment and the paperwork that travels with it.',
    pack: 'In the USA, the oranges are packed and loaded into a refrigerated container.',
    load: 'The container is lifted onto a cargo ship bound for the UK.',
  },
  journey: {
    sail: 'The ship sets off across the Atlantic.',
    map: 'Florida to Southampton: about ten days at sea.',
    desk: 'While the ship is at sea, she starts her customs declaration.',
    code: `She enters commodity code ${CODES.wrong}. It’s outdated: navel oranges now need ${CODES.right}.`,
    branch: 'Here the story splits. Choose what happens next.',
  },
  a: {
    submit: 'She submits the declaration as it is. Nothing flags the outdated code.',
    nearing: 'Days later, the ship nears the UK.',
    rejected: 'The declaration is rejected. The message doesn’t tell her what’s wrong.',
    search: 'She searches guidance and tariff pages, trying to work out the problem.',
    arrive: 'The ship arrives before she can fix it.',
    hold: 'The container is held at the border while the declaration is sorted out.',
    days: 'Days pass. Storage charges build up and the fruit is losing freshness.',
    release: 'Day 4. The corrected declaration is accepted and the container is released.',
    late: 'Her oranges arrive three days late.',
  },
  b: {
    rewind: `Back to the moment she types ${CODES.wrong}…`,
    tap: 'Before she submits, the pre-submission checker steps in.',
    explain: 'It spots the outdated commodity code and shows the right one.',
    fix: 'She updates the code and submits a declaration that will pass.',
    accepted: 'Accepted first time.',
    arrive: 'The ship arrives with the declaration already accepted.',
    clear: 'The container clears the border without waiting.',
    home: 'Her oranges arrive fresh and on time.',
  },
};

export const ASSISTANT = {
  hello: 'Haven’t you forgotten something?',
  point: 'That commodity code is out of date.',
  callout: {
    title: 'Outdated commodity code',
    body: `${CODES.wrong} is no longer the right code for fresh navel oranges. Use ${CODES.right}.`,
    action: `Update to ${CODES.right}`,
  },
  done: 'All set. You’re good to submit.',
};

export const REJECTION = {
  title: 'Declaration rejected',
  body: 'Goods item 1: data element 6/14 failed validation.',
  searches: ['“6/14 failed validation”', 'commodity code oranges', 'why was my declaration rejected'],
};

export const OUTCOMES = {
  a: {
    eyebrow: 'Scenario A · Current system',
    title: 'Held at the border for 3 days',
    points: ['The error was only found after she submitted', 'The rejection message didn’t say what to fix', 'Storage charges built up and the fruit lost freshness'],
    stat: { label: 'Time at the border', value: '3 days' },
    next: { id: 'b', label: 'See it with pre-submission checks' },
  },
  b: {
    eyebrow: 'Scenario B · With pre-submission checks',
    title: 'Cleared on arrival',
    points: ['The outdated code was caught before she submitted', 'She was shown the right code and fixed it in seconds', 'Fresh oranges delivered on time'],
    stat: { label: 'Time at the border', value: 'No delay' },
    next: { id: 'a', label: 'Compare with the current system' },
  },
};

export const INFO = {
  her: { kind: 'Main character', name: 'The importer', desc: 'Runs a small fruit import business in the UK and does her own customs paperwork.', spec: 'Importing: fresh navel oranges' },
  assistant: { kind: 'Proposed solution', name: 'Pre-submission checker', desc: 'Reviews a declaration before it’s sent and flags problems such as outdated commodity codes.', spec: 'Catches errors before submission' },
  container: { kind: 'Shipment', name: 'Container of oranges', desc: 'A refrigerated 20-foot container packed with crates of fresh navel oranges.', spec: `Correct commodity code ${CODES.right}` },
  crate: { kind: 'Goods', name: 'Crate of navel oranges', desc: 'Fresh fruit has a short shelf life, so every day of delay matters.', spec: 'Perishable' },
  sample: { kind: 'Goods', name: 'Sample crate', desc: 'Pulled from the container while it waits at the border.', spec: 'Freshness drops each day' },
  ship: { kind: 'Transport', name: 'Cargo ship', desc: 'Carries the container across the Atlantic from the USA to the UK.', spec: 'Atlantic crossing' },
  crane: { kind: 'Port', name: 'Ship-to-shore crane', desc: 'Lifts containers between the quay and the ship.', spec: 'Loads and unloads' },
  truck: { kind: 'Transport', name: 'Haulage truck', desc: 'Collects the container at the UK port and takes it through the border.', spec: 'Port to warehouse' },
  checkpoint: { kind: 'Border', name: 'UK customs checkpoint', desc: 'Goods are released once the customs declaration has been accepted.', spec: 'Declaration must be accepted' },
  laptop: { kind: 'Paperwork', name: 'Customs declaration', desc: 'She completes the import declaration online while the goods are still at sea.', spec: 'Includes the commodity code' },
  invoice: { kind: 'Shipping document', name: 'Commercial invoice', desc: 'Lists the goods, their price and who is buying and selling.', spec: 'Travels with the shipment' },
  phyto: { kind: 'Shipping document', name: 'Phytosanitary certificate', desc: 'Confirms the fruit meets plant-health rules for import.', spec: 'Issued in the exporting country' },
  lading: { kind: 'Shipping document', name: 'Bill of lading', desc: 'The carrier’s receipt for the cargo and the contract to ship it.', spec: 'Issued by the shipping line' },
  grove: { kind: 'Origin', name: 'Orange grove', desc: 'Where the navel oranges are grown and picked.', spec: 'Florida, USA' },
  packhouse: { kind: 'Origin', name: 'Citrus packhouse', desc: 'The oranges are washed, graded and packed into crates here.', spec: 'Packed for export' },
};
