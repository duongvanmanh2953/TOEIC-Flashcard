const fs = require('fs');

const kioskMgmtPath = 'C:/Users/manhd/Desktop/tenant-web/src/views/admin/restaurant/KioskManagement.vue';
let kmContent = fs.readFileSync(kioskMgmtPath, 'utf8');

// 1. Change col-lg-8 and col-lg-4 to col-lg-6
kmContent = kmContent.replace('class="col-lg-8 col-12"', 'class="col-lg-6 col-12"');
kmContent = kmContent.replace('class="col-lg-4 col-12"', 'class="col-lg-6 col-12"');

// 2. Change :orientation="form.orientation" to v-model:orientation="form.orientation"
kmContent = kmContent.replace(':orientation="form.orientation"', 'v-model:orientation="form.orientation"');

// 3. Update departmentOptionsList mapping
kmContent = kmContent.replace(
  'const departmentOptionsList = computed(() =>\n  departmentList.value.map((d: any) => ({ id: d.id, name: d.name }))\n);',
  `const departmentOptionsList = computed(() =>
  departmentList.value.map((d: any) => ({
    id: d.id,
    name: d.name || d.department_name || \`Điểm kinh doanh #\${d.id}\`,
  }))
);`
);

// 4. Update getDeptNameById
kmContent = kmContent.replace(
  'return found ? found.name : `Điểm kinh doanh #${id}`;',
  'return found ? (found.name || found.department_name) : `Điểm kinh doanh #${id}`;'
);

// 5. Update onMounted
kmContent = kmContent.replace(
  `  if (departmentList.value.length === 0) {
    try {
      await deptStore.list({ is_all: 1, is_get_outlet_by_role: true }, false);
    } catch (e) {
      console.error("Could not load departments:", e);
    }
  }`,
  `  try {
    await deptStore.list({ is_get_outlet_by_role: true }, false);
  } catch (e) {
    console.error("Could not load departments:", e);
  }`
);

fs.writeFileSync(kioskMgmtPath, kmContent, 'utf8');
console.log('KioskManagement.vue successfully updated!');
