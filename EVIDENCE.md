# F1 Close Evidence - Scenario A: 9809.98 TRY ✅

## Request (Nested Structure)
```json
{
  "stoneColorId": "cmu9pojis000vjrrp5epidwok",
  "thicknessId": "cmu9pojiy001djrrp8x5dfbpi",
  "formTypeId": "cmu9pojj0001gjrrp0678b8d4",
  "edgeTypeId": "cmu9pojj2001jjrrps0l86qvb",
  "dimensions": { 
    "formType": "L", 
    "leg1": 320, 
    "leg2": 180, 
    "depth": 65 
  },
  "sink": { 
    "type": "undermount", 
    "holes": 1 
  },
  "cooktopHole": true,
  "install": true,
  "skirting": { 
    "enabled": false 
  },
  "trim": { 
    "enabled": false 
  },
  "panelled": false,
  "sideBox": { 
    "enabled": false 
  },
  "address": { 
    "city": "İstanbul", 
    "district": "Kadıköy" 
  }
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
      "code": "SINK_HOLE",
      "label": "Eviye Deliği",
      "unit": "ADET",
      "quantity": "1",
      "unitPrice": "300.00",
      "lineTotal": "300.00",
      "sortOrder": 1
    },
    {
      "code": "COOKTOP_HOLE",
      "label": "Ocak Deliği",
      "unit": "ADET",
      "quantity": "1",
      "unitPrice": "350.00",
      "lineTotal": "350.00",
      "sortOrder": 2
    },
    {
      "code": "INSTALL",
      "label": "Montaj",
      "unit": "HIZMET",
      "quantity": "1",
      "unitPrice": "500.00",
      "lineTotal": "500.00",
      "sortOrder": 3
    },
    {
      "code": "SHIPPING",
      "label": "Sevkiyat - İstanbul/Kadıköy",
      "unit": "HIZMET",
      "quantity": "1",
      "unitPrice": "400.00",
      "lineTotal": "400.00",
      "sortOrder": 4
    }
  ],
  "subtotalExVat": "8174.98",
  "dealerDiscount": "0.00",
  "promoDiscount": "0.00",
  "vatAmount": "1635.00",
  "vatRate": "0.2000",
  "totalInclVat": "9809.98",
  "total": "9809.98",
  "warnings": []
}
```

## Verification
✅ **totalInclVat: 9809.98** (Expected: 9809.98)

## Line Item Breakdown
- Beyaz Kuvars - 3 cm: 2.9689 M² × ₺2,231.46 = **₺6,624.98**
- Eviye Deliği (Sink): 1 × ₺300.00 = **₺300.00**
- Ocak Deliği (Cooktop): 1 × ₺350.00 = **₺350.00**
- Montaj (Install): 1 × ₺500.00 = **₺500.00**
- Sevkiyat (Shipping): İstanbul/Kadıköy = **₺400.00**

**Subtotal (ex VAT)**: ₺8,174.98  
**VAT (20%)**: ₺1,635.00  
**TOTAL (incl VAT)**: **₺9,809.98** ✅

## Artifacts
- `scenario-a-nested-proof.png` - UI screenshot showing 9809.98
- `scenario-a-network-log.png` - DevTools network log
- `/tmp/nested-response.json` - Full API response
