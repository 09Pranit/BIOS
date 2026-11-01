import { describe, expect, it } from 'vitest';
import { matchesChild, parseRoster, parseScore, toCSV } from '../apps/pwa/src/lib/entry';
describe('data entry validation', () => {
  it('imports school records without requesting a village', () => {
    expect(parseRoster('name,dob,class,consent\nExample Student,2019-04-15,Class 1,true')[0].village).toBe('Not specified');
  });
  it('keeps zero scores and rejects blank, out-of-range and non-numeric scores', () => {
    expect(parseScore('0')).toBe(0);
    expect(parseScore('87.5')).toBe(87.5);
    for (const score of ['', '  ', '-1', '101', 'Infinity', 'not a mark'])
      expect(() => parseScore(score)).toThrow();
  });
  it('finds children using multiple terms across name, ID, guardian, class and village', () => {
    const child = {
      name: 'Aarohi Kaur',
      id: 'child-001',
      village: 'Dhareri',
      guardian: 'Simran Kaur',
      class: 'Class 1',
    };
    expect(matchesChild(child, 'aarohi dhareri')).toBe(true);
    expect(matchesChild(child, '001 Simran')).toBe(true);
    expect(matchesChild(child, 'class 1')).toBe(true);
    expect(matchesChild(child, 'Baran')).toBe(false);
  });
  it('parses quoted names, commas, escaped quotes, CRLF and an optional guardian', () => {
    const rows = parseRoster(
      '\uFEFFname,dob,class,village,guardian,consent\r\n"Kaur, Example",2019-04-15,Class 1,Dhareri,"A ""quoted"" guardian",true\r\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Kaur, Example');
    expect(rows[0].guardian).toBe('A "quoted" guardian');
    expect(rows[0].consent).toBe(true);
    expect(
      parseRoster('name,dob,class,village,consent\nExample Child,2019-04-15,Class 1,Dhareri,true')[0]
        .guardian,
    ).toBe('');
  });
  it('rejects invalid dates, missing consent, repeated children and unsupported columns before importing anything', () => {
    const header = 'name,dob,class,village,consent\n',
      valid = 'Example Child,2019-04-15,Class 1,Dhareri,true';
    expect(() => parseRoster(header + valid.replace('2019-04-15', '2019-02-30'))).toThrow('valid date');
    expect(() => parseRoster(header + valid.replace('true', 'false'))).toThrow('consent');
    expect(() => parseRoster(header + valid + '\n' + valid)).toThrow('repeated child');
    expect(() => parseRoster('name,dob,class,village,consent,national_id\n')).toThrow('template columns');
    expect(() => parseRoster(header + '"Unclosed name')).toThrow('not closed');
    expect(() => parseRoster(header + '"Example"suffix,2019-04-15,Class 1,Dhareri,true')).toThrow(
      'after a quoted',
    );
  });
  it('exports valid CSV with escaped quotes and spreadsheet-formula protection', () => {
    expect(toCSV([['A "name"', 'a,b', '=SUM(A1)', 0]])).toBe('"A ""name""","a,b","\'=SUM(A1)","0"');
  });
});
