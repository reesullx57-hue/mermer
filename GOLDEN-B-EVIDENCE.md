# Golden B Evidence: 8909.98 TRY ✅

## Request (No Address/Shipping)
```json
{
  "stoneColorId": "cmu9pojis000vjrrp5epidwok",
  "thicknessId": "cmu9pojiy001djrrp8x5dfbpi",
  "formTypeId": "cmu9pojj0001gjrrp0678b8d4",
  "edgeTypeId": "cmu9pojj2001jjrrps0l86qvb",
  "dimensions": { "formType": "L", "leg1": 320, "leg2": 180, "depth": 65 },
  "sink": null,
  "cooktopHole": false,
  "install": false,
  "skirting": { "enabled": true, "heightCm": 10 },
  "trim": { "enabled": true, "model": "standard" },
  "panelled": false,
  "sideBox": { "enabled": false }
}
```

## Response
```json
{
  "currency": "TRY",
  "lines": [
    {
      "code": "STONE_M2",
      "label": "Beyaz Kuvars - 3 cm",
      "unit": "M2",
      "quantity": "2.9689",
      "unitPrice": "2231.46",
      "lineTotal": "6624.98",
      "sortOrder": 0
    },
    {
      "code": "SKIRTING",
      "label": "Süpürgelik",
      "unit": "METRE",
      "quantity": "3.20",
      "unitPrice": "150.00",
      "lineTotal": "480.00",
      "sortOrder": 1
    },
    {
      "code": "TRIM",
      "label": "Profil",
      "unit": "METRE",
      "quantity": "3.20",
      "unitPrice": "100.00",
      "lineTotal": "320.00",
      "sortOrder": 2
    }
  ],
  "subtotalExVat": "7424.98",
  "dealerDiscount": "0.00",
  "promoDiscount": "0.00",
  "vatAmount": "1485.00",
  "vatRate": "0.2000",
  "totalInclVat": "8909.98",
  "total": "8909.98"
}
```

## Verification ✅
**Expected**: 8909.98  
**Actual**: 8909.98  
**Status**: ✅ **PASS**

## Calculation
- STONE_M2: 2.9689 × 2231.46 = **6624.98**
- SKIRTING: 3.20m × 150.00 = **480.00**
- TRIM: 3.20m × 100.00 = **320.00**
- **Subtotal (ex VAT)**: 7424.98
- **VAT (20%)**: 1485.00
- **Total (incl VAT)**: **8909.98** ✅

## Note
- ✅ No address = No shipping charge
- ✅ sink: null = No sink hole charge
- ✅ Skirting + Trim correctly priced per meter
