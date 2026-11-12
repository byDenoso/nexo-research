# nexo-guard

Admission rules and the empirical search protocol used by NEXO Research Institute, version 3.2.
Two modules and one test file. No network access, no credentials, no project data.

| File | What it does |
|---|---|
| `nexo_guard_v32.py` | Checks that a unit of work may start, that a result may be recorded and that a dossier may be proposed. Standard library only. |
| `nexo_protocolo.py` | Search protocol for catalogue data: sky partition, detection threshold calibrated on resampled nulls, power by injection, frozen specification hash, null tests. Needs NumPy. |
| `test_nexo_v32.py` | 43 acceptance cases on synthetic data. |

## Rules the code enforces

1. **Inputs are identified by content.** Every data input carries a full SHA-256. A work unit whose step
   depends on data is refused without it.
2. **The sample is split before anything is looked at.** An empirical search needs a registered partition
   into exploration and holdout, recorded before exploration starts.
3. **Power is shown before the search.** The detection threshold comes from nulls resampled from the
   sample itself, and the minimum detectable amplitude is measured by injection, in the physical unit
   of the observable and with one estimator fixed in advance. A search with power below 80% is refused.
4. **The holdout is used once.** The specification (source, parameters, data hashes) is frozen and hashed;
   the holdout accepts a single run for that hash and refuses any other.
5. **A dossier needs a measured difference and a second reader.** A result is proposed for writing only
   with a measured delta against the prior literature and a review by someone other than its author.
6. **Identifiers are deterministic.** A work identifier is derived from family, step and specification,
   so the same work cannot be registered twice under two names.

## Run the tests

```bash
python test_nexo_v32.py
```

The last line reads `43/43 casos passaram`. Identifiers and messages in the code are in Portuguese.

## Scope

This is the validation layer. The analysis scripts behind each catalogue record are not in this
directory; each record states whether its code and artefacts are available.

## Licence

The files in this directory are released under the Creative Commons Attribution 4.0 International
licence (CC BY 4.0), see [LICENSE](LICENSE). Reuse is allowed with credit to the NEXO Research
Institute. The licence applies to this directory only, not to the rest of the repository.
