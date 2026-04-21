import * as zlib from 'zlib'
import { parseTransparencyFeed } from './parse-transparency-feed'

/**
 * Tests for the transparency-feed XML parser. The parser takes a gzipped
 * XML buffer (as downloaded from url.publishedprices.co.il) and returns a
 * normalized `TransparencyItem[]`.
 *
 * Fixture XML mirrors the real schema observed from Tiv Taam on 2026-04-21.
 */

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <ChainID>7290873255550</ChainID>
  <SubChainID>000</SubChainID>
  <StoreID>002</StoreID>
  <Items>
    <Item>
      <ItemCode>7290004131074</ItemCode>
      <ItemType>1</ItemType>
      <ItemName>חלב תנובה 3% 1 ליטר</ItemName>
      <ManufactureName>תנובה</ManufactureName>
      <ManufactureCountry>ישראל</ManufactureCountry>
      <UnitOfMeasure>ליטר</UnitOfMeasure>
      <Quantity>1.00</Quantity>
      <bIsWeighted>0</bIsWeighted>
    </Item>
    <Item>
      <ItemCode>1101346</ItemCode>
      <ItemType>0</ItemType>
      <ItemName>בוזנינה לבנה להב</ItemName>
      <ManufactureName>לא ידוע</ManufactureName>
      <ManufactureCountry></ManufactureCountry>
      <UnitOfMeasure>יחידות</UnitOfMeasure>
      <Quantity>1.00</Quantity>
      <bIsWeighted>1</bIsWeighted>
    </Item>
    <Item>
      <ItemName>invalid item — no ItemCode</ItemName>
    </Item>
  </Items>
</Root>`

function makeGz(xml: string): Buffer {
  return zlib.gzipSync(Buffer.from(xml, 'utf8'))
}

describe('parseTransparencyFeed', () => {
  it('returns empty array for empty <Items> block', () => {
    const xml = '<Root><Items></Items></Root>'
    expect(parseTransparencyFeed(makeGz(xml))).toEqual([])
  })

  it('parses a packaged item correctly', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[0]).toEqual({
      itemCode: '7290004131074',
      nameHe: 'חלב תנובה 3% 1 ליטר',
      manufactureName: 'תנובה',
      manufactureCountry: 'ישראל',
      unitOfMeasure: 'ליטר',
      quantity: 1,
      isWeighted: false,
      itemType: 1,
    })
  })

  it('parses a weighted deli item (empty country) correctly', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[1]).toMatchObject({
      itemCode: '1101346',
      nameHe: 'בוזנינה לבנה להב',
      isWeighted: true,
      itemType: 0,
      manufactureCountry: '',
    })
  })

  it('skips items missing ItemCode or ItemName', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items).toHaveLength(2) // third <Item> (no ItemCode) dropped
  })

  it('preserves Hebrew unicode correctly (no mojibake)', () => {
    const items = parseTransparencyFeed(makeGz(FIXTURE_XML))
    expect(items[0].nameHe).toContain('תנובה')
    expect(items[0].manufactureName).toBe('תנובה')
  })

  it('coerces numeric fields (Quantity, bIsWeighted, ItemType)', () => {
    const xml = `<Root><Items><Item>
      <ItemCode>123</ItemCode>
      <ItemName>x</ItemName>
      <Quantity>2.50</Quantity>
      <bIsWeighted>0</bIsWeighted>
      <ItemType>1</ItemType>
    </Item></Items></Root>`
    const [item] = parseTransparencyFeed(makeGz(xml))
    expect(item.quantity).toBe(2.5)
    expect(item.isWeighted).toBe(false)
    expect(item.itemType).toBe(1)
  })

  it('defaults quantity to 0 when <Quantity> is absent', () => {
    const xml = `<Root><Items><Item>
      <ItemCode>123</ItemCode>
      <ItemName>x</ItemName>
    </Item></Items></Root>`
    const [item] = parseTransparencyFeed(makeGz(xml))
    expect(item.quantity).toBe(0)
  })

  it('handles a single-item feed (array normalization)', () => {
    // fast-xml-parser returns a singleton object for single children unless
    // `isArray` is configured to force array. Verify we normalize.
    const xml = `<Root><Items><Item>
      <ItemCode>1</ItemCode><ItemName>solo</ItemName>
    </Item></Items></Root>`
    const items = parseTransparencyFeed(makeGz(xml))
    expect(Array.isArray(items)).toBe(true)
    expect(items).toHaveLength(1)
    expect(items[0].itemCode).toBe('1')
  })

  it('tolerates corrupt gzip input with a clear error', () => {
    const bad = Buffer.from('not gzipped')
    expect(() => parseTransparencyFeed(bad)).toThrow(/gzip|decompress/i)
  })

  it('handles lowercase root + `ManufacturerName` alias (Tiv Taam store variant)', () => {
    // Regression: some Tiv Taam stores serialize with <root> (lowercase) +
    // <ManufacturerName> (with 'r'), others with <Root> + <ManufactureName>.
    // The parser must handle both without special-casing per store.
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <ChainId>7290873255550</ChainId>
  <Items Count="1">
    <Item>
      <ItemCode>7290004131074</ItemCode>
      <ItemType>1</ItemType>
      <ItemName>חלב תנובה 3%</ItemName>
      <ManufacturerName>תנובה</ManufacturerName>
      <ManufactureCountry>ישראל</ManufactureCountry>
      <UnitOfMeasure>ליטר</UnitOfMeasure>
      <Quantity>1.00</Quantity>
      <bIsWeighted>0</bIsWeighted>
    </Item>
  </Items>
</root>`
    const items = parseTransparencyFeed(makeGz(xml))
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      itemCode: '7290004131074',
      nameHe: 'חלב תנובה 3%',
      manufactureName: 'תנובה',
      manufactureCountry: 'ישראל',
    })
  })
})
