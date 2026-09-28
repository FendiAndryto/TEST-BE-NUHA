import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data in reverse order of foreign keys
  await prisma.roleMenu.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Roles
  console.log('Creating roles...');
  const roleSuperAdmin = await prisma.role.create({
    data: {
      name: 'Super Administrator',
      code: 'SUPER_ADMIN',
      description: 'Akses penuh ke semua menu dan manajemen sistem'
    }
  });

  const roleManager = await prisma.role.create({
    data: {
      name: 'Manager Operasional',
      code: 'MANAGER_OPS',
      description: 'Akses operasional: Menu 1 & Menu 2'
    }
  });

  const roleSupervisor = await prisma.role.create({
    data: {
      name: 'Supervisor Lapangan',
      code: 'SUPERVISOR',
      description: 'Akses supervisi: Menu 2 & Menu 3'
    }
  });

  const roleStaff = await prisma.role.create({
    data: {
      name: 'Staff Administrasi',
      code: 'STAFF',
      description: 'Akses terbatas: Menu 1'
    }
  });

  // 3. Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  // User 1: Super Admin (Single role)
  const userAdmin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedAdminPassword,
      name: 'Ahmad Super Admin',
      email: 'admin@nuha.care',
      roles: {
        create: [{ roleId: roleSuperAdmin.id }]
      }
    }
  });

  // User 2: Budi (DUAL ROLE: Manager Operasional & Supervisor Lapangan)
  // Memenuhi Kriteria #2: Karyawan dengan jabatan ganda
  const userDualRole = await prisma.user.create({
    data: {
      username: 'budi.santoso',
      password: hashedPassword,
      name: 'Budi Santoso (Jabatan Ganda)',
      email: 'budi.santoso@nuha.care',
      roles: {
        create: [
          { roleId: roleManager.id },
          { roleId: roleSupervisor.id }
        ]
      }
    }
  });

  // User 3: Siti (Single Role: Staff)
  const userStaff = await prisma.user.create({
    data: {
      username: 'siti.aminah',
      password: hashedPassword,
      name: 'Siti Aminah',
      email: 'siti.aminah@nuha.care',
      roles: {
        create: [{ roleId: roleStaff.id }]
      }
    }
  });

  // 4. Create Menus according to the exact test specifications:
  console.log('Creating hierarchical menus...');

  // Level 1: Menu 1
  const m1 = await prisma.menu.create({
    data: { name: 'Menu 1', code: 'M1', icon: 'folder', path: '/menu-1', orderIndex: 1 }
  });

  const m1_1 = await prisma.menu.create({
    data: { name: 'Menu 1.1', code: 'M1_1', icon: 'file-text', path: '/menu-1/1', parentId: m1.id, orderIndex: 1 }
  });

  const m1_2 = await prisma.menu.create({
    data: { name: 'Menu 1.2', code: 'M1_2', icon: 'folder', path: '/menu-1/2', parentId: m1.id, orderIndex: 2 }
  });

  const m1_2_1 = await prisma.menu.create({
    data: { name: 'Menu 1.2.1', code: 'M1_2_1', icon: 'file-text', path: '/menu-1/2/1', parentId: m1_2.id, orderIndex: 1 }
  });

  const m1_2_2 = await prisma.menu.create({
    data: { name: 'Menu 1.2.2', code: 'M1_2_2', icon: 'file-text', path: '/menu-1/2/2', parentId: m1_2.id, orderIndex: 2 }
  });

  const m1_3 = await prisma.menu.create({
    data: { name: 'Menu 1.3', code: 'M1_3', icon: 'folder', path: '/menu-1/3', parentId: m1.id, orderIndex: 3 }
  });

  const m1_3_1 = await prisma.menu.create({
    data: { name: 'Menu 1.3.1', code: 'M1_3_1', icon: 'file-text', path: '/menu-1/3/1', parentId: m1_3.id, orderIndex: 1 }
  });

  // Level 1: Menu 2
  const m2 = await prisma.menu.create({
    data: { name: 'Menu 2', code: 'M2', icon: 'layers', path: '/menu-2', orderIndex: 2 }
  });

  const m2_1 = await prisma.menu.create({
    data: { name: 'Menu 2.1', code: 'M2_1', icon: 'file-text', path: '/menu-2/1', parentId: m2.id, orderIndex: 1 }
  });

  const m2_2 = await prisma.menu.create({
    data: { name: 'Menu 2.2', code: 'M2_2', icon: 'folder', path: '/menu-2/2', parentId: m2.id, orderIndex: 2 }
  });

  const m2_2_1 = await prisma.menu.create({
    data: { name: 'Menu 2.2.1', code: 'M2_2_1', icon: 'file-text', path: '/menu-2/2/1', parentId: m2_2.id, orderIndex: 1 }
  });

  const m2_2_2 = await prisma.menu.create({
    data: { name: 'Menu 2.2.2', code: 'M2_2_2', icon: 'folder', path: '/menu-2/2/2', parentId: m2_2.id, orderIndex: 2 }
  });

  // Deep nesting Level 4
  const m2_2_2_1 = await prisma.menu.create({
    data: { name: 'Menu 2.2.2.1', code: 'M2_2_2_1', icon: 'file-text', path: '/menu-2/2/2/1', parentId: m2_2_2.id, orderIndex: 1 }
  });

  const m2_2_2_2 = await prisma.menu.create({
    data: { name: 'Menu 2.2.2.2', code: 'M2_2_2_2', icon: 'file-text', path: '/menu-2/2/2/2', parentId: m2_2_2.id, orderIndex: 2 }
  });

  const m2_2_3 = await prisma.menu.create({
    data: { name: 'Menu 2.2.3', code: 'M2_2_3', icon: 'file-text', path: '/menu-2/2/3', parentId: m2_2.id, orderIndex: 3 }
  });

  const m2_3 = await prisma.menu.create({
    data: { name: 'Menu 2.3', code: 'M2_3', icon: 'file-text', path: '/menu-2/3', parentId: m2.id, orderIndex: 3 }
  });

  // Level 1: Menu 3
  const m3 = await prisma.menu.create({
    data: { name: 'Menu 3', code: 'M3', icon: 'box', path: '/menu-3', orderIndex: 3 }
  });

  const m3_1 = await prisma.menu.create({
    data: { name: 'Menu 3.1', code: 'M3_1', icon: 'file-text', path: '/menu-3/1', parentId: m3.id, orderIndex: 1 }
  });

  const m3_2 = await prisma.menu.create({
    data: { name: 'Menu 3.2', code: 'M3_2', icon: 'file-text', path: '/menu-3/2', parentId: m3.id, orderIndex: 2 }
  });

  // 5. System Management Menus (for Super Admin)
  const mMgmt = await prisma.menu.create({
    data: { name: 'System Management', code: 'SYS_MGMT', icon: 'settings', path: '/settings', orderIndex: 99 }
  });

  const mMenuMgmt = await prisma.menu.create({
    data: { name: 'Menu Management', code: 'MENU_MGMT', icon: 'list', path: '/settings/menus', parentId: mMgmt.id, orderIndex: 1 }
  });

  const mRoleMgmt = await prisma.menu.create({
    data: { name: 'Role & Access Management', code: 'ROLE_MGMT', icon: 'shield', path: '/settings/roles', parentId: mMgmt.id, orderIndex: 2 }
  });

  // 6. Assign Menu Access to Roles
  console.log('Assigning menu permissions to roles...');

  const allMenus = [
    m1, m1_1, m1_2, m1_2_1, m1_2_2, m1_3, m1_3_1,
    m2, m2_1, m2_2, m2_2_1, m2_2_2, m2_2_2_1, m2_2_2_2, m2_2_3, m2_3,
    m3, m3_1, m3_2,
    mMgmt, mMenuMgmt, mRoleMgmt
  ];

  // Super Admin gets all menus
  for (const menu of allMenus) {
    await prisma.roleMenu.create({
      data: { roleId: roleSuperAdmin.id, menuId: menu.id }
    });
  }

  // Manager Operasional gets Menu 1 & Menu 2
  const managerMenus = [
    m1, m1_1, m1_2, m1_2_1, m1_2_2, m1_3, m1_3_1,
    m2, m2_1, m2_2, m2_2_1, m2_2_2, m2_2_2_1, m2_2_2_2, m2_2_3, m2_3
  ];
  for (const menu of managerMenus) {
    await prisma.roleMenu.create({
      data: { roleId: roleManager.id, menuId: menu.id }
    });
  }

  // Supervisor Lapangan gets Menu 2 & Menu 3
  const supervisorMenus = [
    m2, m2_1, m2_2, m2_2_1, m2_2_2, m2_2_2_1, m2_2_2_2, m2_2_3, m2_3,
    m3, m3_1, m3_2
  ];
  for (const menu of supervisorMenus) {
    await prisma.roleMenu.create({
      data: { roleId: roleSupervisor.id, menuId: menu.id }
    });
  }

  // Staff gets Menu 1 only
  const staffMenus = [
    m1, m1_1, m1_2, m1_2_1, m1_2_2, m1_3, m1_3_1
  ];
  for (const menu of staffMenus) {
    await prisma.roleMenu.create({
      data: { roleId: roleStaff.id, menuId: menu.id }
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log('\n--- DATA AKUN UJI COBA INTERVIEW ---');
  console.log('1. Super Admin:');
  console.log('   Username: admin | Password: admin123 | Role: Super Administrator');
  console.log('2. Dual-Role Employee (Kriteria #2):');
  console.log('   Username: budi.santoso | Password: password123 | Roles: Manager Operasional, Supervisor Lapangan');
  console.log('3. Single-Role Employee:');
  console.log('   Username: siti.aminah | Password: password123 | Role: Staff Administrasi');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
