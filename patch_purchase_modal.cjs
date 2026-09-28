const fs = require('fs');

let content = fs.readFileSync('src/pages/InventoryPage.jsx', 'utf8');

const oldModalStart = `      {isPurchaseModalOpen && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Direct Store Purchase (External)"
        >`;

const newModalStart = `      {isPurchaseModalOpen && (
        <Modal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          title="Direct Store Purchase (External)"
          maxWidth="sm:max-w-2xl max-w-md"
        >`;

content = content.replace(oldModalStart, newModalStart);

const targetDiv = `            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Product:</label>
              <input
                type="text"
                placeholder="Search product..."
                value={purchaseProductSearch}
                onChange={(e) => setPurchaseProductSearch(e.target.value)}
                className="w-full mb-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <select
                value={purchaseForm.productId}
                onChange={(e) => {
                  const p = products.find(prod => prod.id === e.target.value)
                  setPurchaseForm({
                    ...purchaseForm,
                    productId: e.target.value,
                    costPerUnit: p ? p.costPrice : purchaseForm.costPerUnit
                  })
                }}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
              >
                {products
                  .filter(p => !purchaseProductSearch || p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Cost: {formatCurrency(p.costPrice)})
                    </option>
                  ))}
              </select>
            </div>`;

const newTargetDiv = `            {/* Product Mode Toggle: Existing Product vs Create New Product */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setIsPurchaseCreatingNewProduct(false)}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation \${
                  !isPurchaseCreatingNewProduct
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }\`}
              >
                Existing Item
              </button>
              <button
                type="button"
                onClick={() => setIsPurchaseCreatingNewProduct(true)}
                className={\`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors touch-manipulation \${
                  isPurchaseCreatingNewProduct
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }\`}
              >
                New Product
              </button>
            </div>

            {!isPurchaseCreatingNewProduct ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product:</label>
                <input
                  type="text"
                  placeholder="Search product..."
                  value={purchaseProductSearch}
                  onChange={(e) => setPurchaseProductSearch(e.target.value)}
                  className="w-full mb-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={purchaseForm.productId}
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value)
                    setPurchaseForm({
                      ...purchaseForm,
                      productId: e.target.value,
                      costPerUnit: p ? p.costPrice : purchaseForm.costPerUnit
                    })
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                >
                  {products
                    .filter(p => !purchaseProductSearch || p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Cost: {formatCurrency(p.costPrice)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-white border border-blue-200 rounded-xl shadow-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">New Product Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium Coffee Beans"
                      value={purchaseForm.newProductName}
                      onChange={e => setPurchaseForm({ ...purchaseForm, newProductName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Beverages"
                      value={purchaseForm.newProductCategory}
                      onChange={e => setPurchaseForm({ ...purchaseForm, newProductCategory: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={purchaseForm.newProductSellingPrice}
                      onChange={e => setPurchaseForm({ ...purchaseForm, newProductSellingPrice: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}`;

content = content.replace(targetDiv, newTargetDiv);

const oldCostPerUnit = `              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Cost:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {getCurrencySymbol(activeOrg?.currency)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={purchaseForm.costPerUnit}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })}
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                  />
                </div>
              </div>`;

const newCostPerUnit = `              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Cost:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {getCurrencySymbol(activeOrg?.currency)}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit}
                    onChange={(e) => {
                      if (isPurchaseCreatingNewProduct) {
                        setPurchaseForm({ ...purchaseForm, newProductCostPrice: e.target.value })
                      } else {
                        setPurchaseForm({ ...purchaseForm, costPerUnit: e.target.value })
                      }
                    }}
                    className="w-full p-2.5 pl-8 bg-white border border-slate-300 rounded-xl min-h-[44px] font-bold"
                  />
                </div>
              </div>`;

content = content.replace(oldCostPerUnit, newCostPerUnit);

const totalCostTarget = `                <span className="font-black text-blue-700">
                  {formatCurrency((parseFloat(purchaseForm.costPerUnit) || 0) * (parseFloat(purchaseForm.quantity) || 0))}
                </span>`;

const totalCostNew = `                <span className="font-black text-blue-700">
                  {formatCurrency((parseFloat(isPurchaseCreatingNewProduct ? purchaseForm.newProductCostPrice : purchaseForm.costPerUnit) || 0) * (parseFloat(purchaseForm.quantity) || 0))}
                </span>`;

content = content.replace(totalCostTarget, totalCostNew);

fs.writeFileSync('src/pages/InventoryPage.jsx', content, 'utf8');
