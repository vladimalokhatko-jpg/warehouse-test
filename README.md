# Warehouse — интерактивная учебная 3D-модель склада

Проект создан для обучения и демонстрации складских процессов. **Не является проектной документацией, корпоративной схемой или отраслевым обязательным стандартом.**

## Зоны приёмки: Warehouse v21

За основу общей логики взята открытая схема **U-flow**: приемка и отгрузка расположены с одной стороны склада. Четыре функциональных участка приёмки расположены в две параллельные линии с отделёнными от них проездами техники:

```text
          RECEIVING DOCKS
      CLEAR FORKLIFT ACCESS
   INSPECTION      |   RECEIVING
        MAIN FORKLIFT CROSS AISLE
   PUTAWAY STAGING |   QUARANTINE (fenced gate)
          STORAGE ACCESS
```

- **Receiving:** один стол для оператора, сканер, принтеры на этом же столе, напольные весы.
- **Inspection:** отдельный инспекционный стол, компактный шкаф измерительных средств.
- **Putaway Staging:** временное ожидание размещения; дополнительных столов нет.
- **Quarantine:** ограждённая площадка с отдельным контролируемым входом; дополнительных столов нет.

Коды **REC, INS, PUT, Q** придуманы для учебной сцены и не представляют собой стандарт предприятия. Цветовые акценты различают функциональные площади, но не обозначают корпоративные статусы материалов.

### Общедоступные референсы

- [British Red Cross Logistics Manual — Setting up a warehouse](https://logistics-manual.redcross.org.uk/manual/warehousing/setting-up-a-warehouse/) — функции приёмки, хранения и карантина, варианты U-flow и through-flow.
- [Quality Material Handling — Receiving Area Layout](https://www.qmhinc.com/receiving-area-layout/) — разделение разгрузки, инспекции и staging.
- [UK HSE — Separating pedestrians and vehicles](https://www.hse.gov.uk/workplacetransport/separating.htm) — отдельные безопасные маршруты и защитные ограждения.
- [APICS / ASCM — Strategic Management of Resources](https://learnhrm.hclspdev.com/assets/ascm-common/files/cltd1/pdf/APICS_CLTD_2025_Mod4.pdf) — открытый учебный пример U-flow.

Эта сцена условная: окончательные размеры проходов, зоны работы погрузчика, пожарные требования, доступность выходов и организация карантина требуют отдельной проверки для конкретного помещения и оборудования.

## Warehouse v22 — protection and routes

Pedestrian access follows the green perimeter walkway with branches to the
SQCD huddle, workstations and mezzanine stairs. An orphan branch into putaway
storage has been removed. Forklift routes remain separate, with marked working
cross-aisles and physical guardrail/bollard protection at vulnerable areas.

The quarantine gate can be opened and closed using the **Open Gate** / **Close Gate**
button; this is a classroom model, not an approved industrial traffic plan.
The inbound workstation access is marked behind pallet positions.

## Warehouse v23 — Protected operator stations

- Inspection LEFT and Receiving RIGHT workstations are set back from the active
  forklift cross-aisle, with impact guardrails along the traffic-facing edge.
- The protected pedestrian corridor begins at the exterior office wall and
  runs straight behind both inbound desks. Each has one short, direct entrance.
- Pallet positions remain accessible from the independent southern forklift aisle.
- Guardrail ends have protective bollards. This is a teaching layout, not an
  approved real-world traffic plan.

## Warehouse v24 — Revised receiving and inspection

The 3D model now has **Inspection on the left** and **Receiving on the right**.
The two worker seats are behind their desks, and the nameplates are attached to
the continuous protective guardrail (not desk fronts).

Pedestrian path junctions have been simplified: no disconnected short spurs,
with a single lane following the north side of both stations. Narrow overlap
strips from adjoining path polygons have been removed to prevent floor seams.

## Публичная версия

https://vladimalokhatko-jpg.github.io/warehouse-test/

Не загружайте в публичный репозиторий конфиденциальную планировку предприятия или внутренние документы.
