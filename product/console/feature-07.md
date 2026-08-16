## Feature 07 — `seed()` Function

**Category:** Data
**Status:** ✅ Ready to implement
**Dependencies:** Feature 2 (needs wired Use Cases and Values factories)

### Why

An empty in-memory state on every console boot makes experimentation tedious. The developer would have to construct Value Objects and execute Use Cases manually just to have data to query. A `seed()` function populates the system with representative data in one call.

### Specification

Create an async `seed()` function that uses the **wired Use Case instances and Values classes** from the auto-discovery results. It must go through the same validation and persistence pipeline that production code uses.

```typescript
async function seed(): Promise<void> {
  // Create supporters
  const aliceName = Name.make('Alice Johnson')
  if (aliceName.error) return console.error('Seed failed:', aliceName.error.message())
  const aliceEmail = Email.make('alice@example.com')
  if (aliceEmail.error) return console.error('Seed failed:', aliceEmail.error.message())

  const aliceResult = await createSupporterUseCase.execute(aliceName.value, aliceEmail.value)
  if (aliceResult.error) return console.error('Seed failed:', aliceResult.error.message())

  const bobName = Name.make('Bob Smith')
  if (bobName.error) return console.error('Seed failed:', bobName.error.message())
  const bobEmail = Email.make('bob@example.com')
  if (bobEmail.error) return console.error('Seed failed:', bobEmail.error.message())

  const bobResult = await createSupporterUseCase.execute(bobName.value, bobEmail.value)
  if (bobResult.error) return console.error('Seed failed:', bobResult.error.message())

  // Create a campaign with tiers
  const campaignName = Name.make('Open Source Project')
  if (campaignName.error) return console.error('Seed failed:', campaignName.error.message())

  const tierNames = ['Bronze', 'Silver', 'Gold']
  const tierValues = [10, 50, 100]
  const tiers: Array<{ name: Name; value: Money }> = []

  for (let i = 0; i < tierNames.length; i++) {
    const tName = Name.make(tierNames[i]!)
    if (tName.error) return console.error('Seed failed:', tName.error.message())
    const tValue = Money.make(tierValues[i]!)
    if (tValue.error) return console.error('Seed failed:', tValue.error.message())
    tiers.push({ name: tName.value, value: tValue.value })
  }

  const campaignResult = await createCampaignUseCase.execute({
    name: campaignName.value,
    tiers,
  })
  if (campaignResult.error) return console.error('Seed failed:', campaignResult.error.message())

  // Make donations
  const donation1Amount = Money.make(50)
  if (donation1Amount.error) return console.error('Seed failed:', donation1Amount.error.message())

  const donation1Result = await makeDonationUseCase.execute({
    campaignId: campaignResult.value,
    supporterId: aliceResult.value,
    amount: donation1Amount.value,
  })
  if (donation1Result.error) return console.error('Seed failed:', donation1Result.error.message())

  const donation2Amount = Money.make(120)
  if (donation2Amount.error) return console.error('Seed failed:', donation2Amount.error.message())

  const donation2Result = await makeDonationUseCase.execute({
    campaignId: campaignResult.value,
    supporterId: bobResult.value,
    amount: donation2Amount.value,
  })
  if (donation2Result.error) return console.error('Seed failed:', donation2Result.error.message())

  console.log('✓ Seeded: 2 supporters, 1 campaign (3 tiers), 2 donations')
}

replServer.context.seed = seed
```

### Notes

- The `seed()` function accesses Use Case instances and Values classes through closure variables from the auto-discovery phase, not through `replServer.context`. This avoids fragile runtime lookups.
- If `seed()` is called twice, the second call fails with `CAMPAIGN_NAME_ALREADY_EXISTS` or `SUPPORTER_EMAIL_ALREADY_EXISTS` (uniqueness enforced by Use Cases). This is expected. The developer should call `clear()` first (Feature 8).
- As the domain model grows with new entities, the seed function should be expanded to cover new relationships.

### Testing

- **Unit Testable:** Yes. The `seed()` function can be tested by running it and then querying the repository instances to ensure the expected entities (campaign, supporters, donations) were created.
