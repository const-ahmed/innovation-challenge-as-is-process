// All story wording in one place: codes, form values, captions, inspect cards and outcomes.
// Figures are illustrative.

export const CODES = { wrong: '08051020', right: '08051022' };

// Where tester feedback goes: a pre-filled issue on this GitHub repo.
export const FEEDBACK = { repo: 'const-ahmed/innovation-challenge-as-is-process', product: 'Oranges Across the Atlantic' };

// The people in the story. Their name labels stay on screen.
export const BUSINESS = 'Rose’s Squeeze';
// Labels give each person's role; only Rose goes by name. The businesses' names are painted on
// their things instead: the stall, the exporter's van and packhouse, the ship, the truck.
export const PEOPLE = {
  rose: { name: 'Rose', role: 'Importer' },
  exporter: { name: 'Exporter & freight forwarder' },
  agent: { name: 'Shipping agent' },
  customers: { name: 'Customers' },
  checker: { name: 'Pre-submission checker' },
  truck: { name: 'Haulier' },
  border: { name: 'UK border control' },
};

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
    meet: `Meet Rose. She runs ${BUSINESS}, a small UK business making fresh American-style orange juice.`,
    order: 'Her juice is catching on and stock is running low. To keep up, she orders a container of fresh navel oranges from Florida.',
    docs: 'She arranges the shipment and the paperwork that travels with it.',
    fly: 'Her order and paperwork go to her exporter in Florida.',
    permits: 'Her exporter and freight forwarder in Florida arranges the export permits, such as the phytosanitary certificate.',
    pack: 'In the USA, the oranges are packed and loaded into a refrigerated container.',
    load: 'The container is lifted onto a cargo ship bound for the UK.',
    lading: 'The shipping agent issues the bill of lading: the receipt for her cargo and the contract to carry it.',
  },
  journey: {
    sail: 'The ship sets off across the Atlantic.',
    map: 'Florida to Southampton: about ten days at sea.',
    desk: 'While the ship is at sea, Rose starts her customs declaration.',
    details: 'She fills in who is importing what, and where it comes from.',
    code: `She enters commodity code ${CODES.wrong}. It’s out of date: navel oranges now have a different code.`,
    branch: 'Here the story splits. Choose what happens next.',
  },
  a: {
    submit: 'Rose submits the declaration as it is. Nothing flags the outdated code.',
    nearing: 'Days later, the ship nears the UK.',
    rejected: 'The declaration is rejected. The message doesn’t tell her what’s wrong.',
    search: 'She searches guidance and tariff pages, trying to work out the problem.',
    arrive: 'The ship arrives before she can fix it.',
    hold: 'The container is held at the border while the declaration is sorted out.',
    days: 'Days pass. Port storage charges build up, the haulier bills for waiting time, and the fruit is losing freshness.',
    release: 'Day 4. The corrected declaration is accepted and the container is released.',
    late: 'Her oranges finally arrive, days late and less fresh.',
    soldout: 'Meanwhile the juice has sold out, and her customers are let down.',
  },
  b: {
    rewind: `Back to the moment she types ${CODES.wrong}…`,
    tap: 'Before she submits, the pre-submission checker steps in.',
    explain: 'It flags that the commodity code may be out of date and points her to the official guidance. It doesn’t tell her which code to use.',
    guidance: 'Rose checks the guidance and finds the current code herself.',
    fixing: 'She updates the code herself.',
    fix: 'No issues flagged. She submits the declaration.',
    accepted: 'Accepted first time.',
    crossing: 'The ship sails on with the declaration already accepted.',
    arrive: 'The ship docks in Southampton.',
    clear: 'The container clears the border without waiting.',
    home: 'Her oranges arrive fresh and on time.',
    customers: 'The juice keeps flowing, and her customers are happy.',
  },
};

// The checker flags problems and points to official guidance. Like HMRC, it never says which
// code to use: that's the declarant's call.
export const ASSISTANT = {
  hello: 'Haven’t you forgotten something?',
  point: 'This commodity code may be out of date.',
  callout: {
    title: 'Check this commodity code',
    body: `${CODES.wrong} may no longer be in use. Check the official guidance to confirm the right code for your goods before you submit.`,
    action: 'Open the guidance',
  },
  done: 'Thanks. No issues flagged now.',
};

// What Rose finds when she opens the guidance.
export const GUIDANCE = {
  source: 'Official guidance · UK Trade Tariff',
  query: 'fresh navel oranges',
  rows: [
    { code: '0805 10 20', text: 'Code no longer in use', state: 'old' },
    { code: '0805 10 22', text: 'Navel oranges, fresh', state: 'match' },
  ],
};

// The charges listed on the hold board as the days pass.
export const HOLD_COSTS = ['Port storage charges', 'Haulier waiting time', 'Hours spent fixing the declaration'];

export const REJECTION = {
  title: 'Declaration rejected',
  body: 'Goods item 1: data element 6/14 failed validation.',
  searches: ['“6/14 failed validation”', 'commodity code oranges', 'why was my declaration rejected'],
};

// The end cards. No verified figures: the delay in the story is illustrative, so the cards
// describe it rather than putting a number on it.
export const OUTCOMES = {
  a: {
    eyebrow: 'Scenario A · Current system',
    title: 'Held at the border, and it cost her',
    groups: [
      { label: 'Financial', text: 'Port storage charges, the haulier billing for waiting time, and lost juice sales.' },
      { label: 'Spoilage', text: 'The oranges lost freshness while they were held, so less of the stock was usable.' },
      { label: 'Administrative', text: 'Time spent decoding an unclear rejection, finding the error and resubmitting.' },
      { label: 'Customers', text: 'The juice sold out while she waited for stock.' },
    ],
    stat: { label: 'At the border', value: 'Delayed' },
    next: { id: 'b', label: 'See it with pre-submission checks' },
  },
  b: {
    eyebrow: 'Scenario B · With pre-submission checks',
    title: 'Cleared on arrival',
    groups: [
      { label: 'Peace of mind', text: 'No rejection to untangle. Rose stayed calm and in control.' },
      { label: 'Time', text: 'The problem was flagged and fixed before she submitted, so the container wasn’t held.' },
      { label: 'Money', text: 'No port storage or extra haulage charges.' },
      { label: 'Admin', text: 'No resubmission, calls or chasing.' },
      { label: 'Spoilage', text: 'The oranges arrived fresh, at full value.' },
      { label: 'Customers', text: 'The juice stayed on sale.' },
    ],
    stat: { label: 'At the border', value: 'No delay' },
    next: { id: 'a', label: 'Compare with the current system' },
  },
};

export const INFO = {
  her: { kind: 'Main character · Importer', name: 'Rose', desc: `Owns ${BUSINESS}, a small UK business (an SME) making fresh American-style orange juice. She does her own customs paperwork.`, spec: 'Importing: fresh navel oranges' },
  exporter: { kind: 'Exporter & freight forwarder', name: 'Sunrise Citrus Co.', desc: 'Sells Rose the oranges in Florida and arranges the export side, including permits such as the phytosanitary certificate.', spec: 'Florida, USA' },
  agent: { kind: 'Shipping agent', name: 'Atlantic Star Line', desc: 'Books the container onto the ship and issues the bill of lading.', spec: 'Issues the bill of lading' },
  customers: { kind: 'End customers', name: 'Rose’s customers', desc: `Cafés, shops and passers-by who buy ${BUSINESS} juice. They need the oranges to arrive on time.`, spec: 'Demand is growing' },
  stall: { kind: 'Rose’s business', name: BUSINESS, desc: 'Fresh American-style orange juice, squeezed from imported navel oranges.', spec: 'Needs a steady supply' },
  assistant: { kind: 'Proposed solution', name: 'Pre-submission checker', desc: 'Reviews a declaration before it’s sent, flags possible problems such as outdated commodity codes, and points to the official guidance. It doesn’t advise which code to use.', spec: 'Flags issues before submission' },
  container: { kind: 'Shipment', name: 'Container of oranges', desc: 'A refrigerated 20-foot container packed with crates of fresh navel oranges.', spec: `Correct commodity code ${CODES.right}` },
  crate: { kind: 'Goods', name: 'Crate of navel oranges', desc: 'Fresh fruit has a short shelf life, so every day of delay matters.', spec: 'Perishable' },
  sample: { kind: 'Goods', name: 'Sample crate', desc: 'Pulled from the container while it waits at the border.', spec: 'Freshness drops each day' },
  ship: { kind: 'Transport', name: 'Cargo ship', desc: 'Carries the container across the Atlantic from the USA to the UK.', spec: 'Atlantic crossing' },
  crane: { kind: 'Port', name: 'Ship-to-shore crane', desc: 'Lifts containers between the quay and the ship.', spec: 'Loads and unloads' },
  truck: { kind: 'Haulier', name: 'John’s Trucking', desc: 'Collects the container at the UK port and takes it through the border to Rose. Time spent waiting at the border is charged.', spec: 'Waiting time adds cost' },
  checkpoint: { kind: 'Border', name: 'UK customs checkpoint', desc: 'Goods are released once the customs declaration has been accepted.', spec: 'Declaration must be accepted' },
  laptop: { kind: 'Paperwork', name: 'Customs declaration', desc: 'She completes the import declaration online while the goods are still at sea.', spec: 'Includes the commodity code' },
  invoice: { kind: 'Shipping document', name: 'Commercial invoice', desc: 'Lists the goods, their price and who is buying and selling.', spec: 'Travels with the shipment' },
  phyto: { kind: 'Shipping document', name: 'Phytosanitary certificate', desc: 'Confirms the fruit meets plant-health rules for import.', spec: 'Issued in the exporting country' },
  lading: { kind: 'Shipping document', name: 'Bill of lading', desc: 'The carrier’s receipt for the cargo and the contract to ship it.', spec: 'Issued by the shipping line' },
  grove: { kind: 'Origin', name: 'Orange grove', desc: 'Where the navel oranges are grown and picked.', spec: 'Florida, USA' },
  packhouse: { kind: 'Origin', name: 'Citrus packhouse', desc: 'The oranges are washed, graded and packed into crates here.', spec: 'Packed for export' },
};
