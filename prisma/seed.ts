import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// Mock data generators
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Margaret', 'Anthony', 'Betty', 'Donald', 'Sandra', 'Mark', 'Ashley',
  'Paul', 'Dorothy', 'Steven', 'Kimberly', 'Andrew', 'Emily', 'Kenneth', 'Donna',
  'Joshua', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Laura',
  'Jeffrey', 'Helen', 'Ryan', 'Sharon', 'Jacob', 'Cynthia', 'Gary', 'Kathleen',
  'Nicholas', 'Amy', 'Eric', 'Shirley', 'Jonathan', 'Angela', 'Stephen', 'Anna',
  'Larry', 'Ruth', 'Justin', 'Brenda', 'Scott', 'Pamela', 'Brandon', 'Nicole',
  'Frank', 'Katherine', 'Benjamin', 'Samantha', 'Gregory', 'Christine', 'Samuel', 'Catherine',
  'Raymond', 'Virginia', 'Patrick', 'Debra', 'Alexander', 'Rachel', 'Jack', 'Janet',
  'Dennis', 'Emma', 'Jerry', 'Carolyn', 'Tyler', 'Maria', 'Aaron', 'Heather',
  'Jose', 'Diane', 'Adam', 'Julie', 'Henry', 'Joyce', 'Nathan', 'Victoria',
  'Douglas', 'Kelly', 'Zachary', 'Christina', 'Peter', 'Lauren', 'Kyle', 'Joan',
  'Walter', 'Evelyn', 'Ethan', 'Olivia', 'Jeremy', 'Judith', 'Harold', 'Megan',
  'Keith', 'Cheryl', 'Christian', 'Martha', 'Roger', 'Andrea', 'Noah', 'Frances',
  'Gerald', 'Hannah', 'Carl', 'Jacqueline', 'Terry', 'Ann', 'Sean', 'Gloria',
  'Austin', 'Jean', 'Arthur', 'Kathryn', 'Lawrence', 'Alice', 'Jesse', 'Teresa',
  'Dylan', 'Sara', 'Bryan', 'Janice', 'Joe', 'Doris', 'Jordan', 'Madison',
  'Billy', 'Julia', 'Bruce', 'Grace', 'Albert', 'Judy', 'Willie', 'Abigail',
  'Gabriel', 'Marie', 'Logan', 'Denise', 'Alan', 'Beverly', 'Juan', 'Amber',
  'Wayne', 'Theresa', 'Roy', 'Marilyn', 'Ralph', 'Danielle', 'Randy', 'Diana',
  'Vincent', 'Brittany', 'Russell', 'Natalie', 'Louis', 'Sophia', 'Philip', 'Rose',
  'Bobby', 'Isabella', 'Johnny', 'Alexis', 'Bradley', 'Kayla', 'Eugene', 'Charlotte'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
  'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz',
  'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long',
  'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan',
  'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher', 'Vasquez',
  'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham', 'Reynolds',
  'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant', 'Herrera',
  'Gibson', 'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray', 'Ford',
  'Castro', 'Marshall', 'Owens', 'Harrison', 'Fernandez', 'Mcdonald', 'Woods', 'Washington',
  'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb', 'Tucker',
  'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter', 'Gordon',
  'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz', 'Hunt',
  'Hicks', 'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd', 'Rose',
  'Stone', 'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice', 'Schmidt',
  'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver', 'Ryan',
  'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins', 'Arnold',
  'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley', 'Knight',
  'Elliott', 'Cunningham', 'Duncan', 'Armstrong', 'Hudson', 'Carroll', 'Lane', 'Riley',
  'Andrews', 'Alvarado', 'Ray', 'Delgado', 'Berry', 'Perkins', 'Hoffman', 'Johnston',
  'Matthews', 'Pena', 'Richards', 'Contreras', 'Willis', 'Carpenter', 'Lawrence', 'Sandoval',
  'Guerrero', 'George', 'Chapman', 'Rios', 'Estrada', 'Ortega', 'Watkins', 'Greene',
  'Nunez', 'Wheeler', 'Valdez', 'Harper', 'Burke', 'Larson', 'Santiago', 'Maldonado',
  'Morrison', 'Franklin', 'Carlson', 'Austin', 'Dominguez', 'Carr', 'Lawson', 'Jacobs',
  'Obrien', 'Lynch', 'Singh', 'Vega', 'Bishop', 'Montgomery', 'Oliver', 'Jensen',
  'Harvey', 'Williamson', 'Gilbert', 'Dean', 'Sims', 'Espinoza', 'Howell', 'Li',
  'Wong', 'Reid', 'Hanson', 'Le', 'Mccoy', 'Garrett', 'Burton', 'Fuller',
  'Wang', 'Weber', 'Welch', 'Rojas', 'Lucas', 'Marquez', 'Fields', 'Park',
  'Yang', 'Little', 'Banks', 'Padilla', 'Day', 'Walsh', 'Bowman', 'Schultz',
  'Luna', 'Fowler', 'Mejia', 'Davidson', 'Acosta', 'Brewer', 'May', 'Holland',
  'Juarez', 'Newman', 'Pearson', 'Curtis', 'Cortez', 'Douglas', 'Schneider', 'Joseph',
  'Barrett', 'Navarro', 'Figueroa', 'Keller', 'Avila', 'Wade', 'Molina', 'Stanley',
  'Hopkins', 'Campos', 'Barnett', 'Bates', 'Chambers', 'Caldwell', 'Beck', 'Lambert',
  'Miranda', 'Byrd', 'Craig', 'Ayala', 'Lowe', 'Frazier', 'Powers', 'Neal',
  'Leonard', 'Gregory', 'Carrillo', 'Sutton', 'Fleming', 'Rhodes', 'Shelton', 'Schwartz',
  'Norris', 'Jennings', 'Watts', 'Duran', 'Walters', 'Cohen', 'Mcdaniel', 'Moran',
  'Parks', 'Steele', 'Vaughn', 'Becker', 'Holt', 'Deleon', 'Barker', 'Terry',
  'Hale', 'Leon', 'Hail', 'Benson', 'Haynes', 'Horton', 'Miles', 'Lyons',
  'Pham', 'Graves', 'Bush', 'Thornton', 'Wolfe', 'Warner', 'Cabrera', 'Mckinney',
  'Mann', 'Zimmerman', 'Dawson', 'Lara', 'Fletcher', 'Page', 'Mccarthy', 'Love',
  'Robles', 'Cervantes', 'Solis', 'Erickson', 'Reeves', 'Chang', 'Klein', 'Salinas',
  'Fuentes', 'Baldwin', 'Daniel', 'Simon', 'Velasquez', 'Hardy', 'Higgins', 'Aguirre',
  'Lin', 'Cummings', 'Chandler', 'Sharp', 'Barber', 'Bowen', 'Ochoa', 'Dennis',
  'Robbins', 'Sloan', 'Mcclain', 'Rocha', 'Herr', 'Mora', 'Rangel', 'Baxter',
  'Cannon', 'Middleton', 'Kaufman', 'Blankenship', 'Meza', 'Finley', 'Lamb', 'Chase',
  'Todd', 'Proctor', 'Jefferson', 'Franco', 'Glenn', 'Bentley', 'Yu', 'Huff',
  'Massey', 'Bauer', 'Crosby', 'Rasmussen', 'Randolph', 'Owen', 'Parrish', 'Anthony',
  'Keith', 'Combs', 'Mathis', 'Christian', 'Skinner', 'Bradford', 'Richard', 'Galvan',
  'Wall', 'Boone', 'Kirby', 'Wilkinson', 'Bridges', 'Bruce', 'Atkinson', 'Velez',
  'Meza', 'Roy', 'Yoder', 'Mccullough', 'Gentry', 'Carrillo', 'Lyons', 'Rogel',
  'Preston', 'Lynn', 'Oconnor', 'Pollard', 'Melton', 'Bernal', 'Khan', 'Burch',
  'Mullins', 'Schroeder', 'Meade', 'House', 'Mcclure', 'Stout', 'Pennington', 'Irwin',
  'Hooper', 'Glass', 'Morse', 'Hickman', 'Hahn', 'English', 'Sexton', 'Keith',
  'Brandt', 'Werner', 'Buckley', 'Mcdowell', 'Coble', 'Merritt', 'Mueller', 'Alston',
  'Person', 'Hurst', 'Hines', 'Bryan', 'Weiss', 'Underwood', 'Bass', 'Greer',
  'Summers', 'Houston', 'Carson', 'Morrow', 'Clayton', 'Whitaker', 'Decker', 'Yates',
  'Berger', 'Cote', 'Fitzpatrick', 'Donovan', 'Maxwell', 'Kane', 'Cortes', 'Cote',
  'Dudley', 'Mcpherson', 'Beltran', 'Dickson', 'Mccann', 'Villegas', 'Proctor', 'Hester',
  'Cantrell', 'Daugherty', 'Cherry', 'Bray', 'Davila', 'Rowland', 'Madden', 'Levine',
  'Spence', 'Good', 'Irwin', 'Werner', 'Krause', 'Petty', 'Whitney', 'Baird',
  'Hoover', 'Valencia', 'Rush', 'Snow', 'Mcconnell', 'Rivas', 'Blanchard', 'Brennan',
  'Mejia', 'Kane', 'Benton', 'Joyce', 'Buck', 'Barrera', 'Gaines', 'Durham',
  'Gentry', 'Mcintyre', 'Sloan', 'Melendez', 'Rocha', 'Herman', 'Sexton', 'Moon',
  'Hendricks', 'Rangel', 'Stark', 'Brock', 'Holloway', 'Brock', 'Boyer', 'Trevino',
  'Dillon', 'Sargent', 'Knowles', 'Mcclain', 'Cline', 'Briggs', 'Rosario', 'Buchanan',
  'Walter', 'Oneal', 'Pitts', 'Gross', 'Conrad', 'Giles', 'Shields', 'Church',
  'Frederick', 'Britt', 'Braun', 'Beasley', 'Huff', 'Odonnell', 'Mullen', 'Wiley',
  'Roth', 'Raymond', 'Holden', 'David', 'Mahoney', 'Valentine', 'Terrell', 'Esparza',
  'Haley', 'Ashley', 'Finch', 'Hays', 'Cain', 'Lester', 'Lester', 'Mack',
  'Ho', 'Jennings', 'Walls', 'Mclean', 'Rasmussen', 'Hays', 'Bush', 'Sweeney',
  'Strong', 'Prince', 'Mcgrath', 'Vu', 'Roberson', 'Osborn', 'Archer', 'Trujillo'
];

const streets = [
  'Main St', 'Oak St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Pine St', 'Washington St', 'Lake St',
  'Hill St', 'Park Ave', 'River Rd', 'Sunset Blvd', 'Broadway', 'Church St', 'Market St', 'High St',
  'Spring St', 'Forest Ave', 'Meadow Ln', 'Garden St', 'Union St', 'State St', 'Franklin St', 'Lincoln St',
  'Jackson St', 'Jefferson Ave', 'Madison St', 'Monroe St', 'Adams St', 'Clark St', 'North St', 'South St',
  'East St', 'West St', 'Central Ave', 'Ridge Rd', 'Valley View', 'Mountain View', 'Ocean View', 'Bay View',
  'Green St', 'Redwood Dr', 'Sycamore St', 'Birch St', 'Walnut St', 'Cherry St', 'Poplar St', 'Willow St',
  'Magnolia Dr', 'Holly St', 'Juniper Ln', 'Cypress St', 'Laurel St', 'Locust St', 'Ash St', 'Beech St',
  'Pecan St', 'Hickory St', 'Dogwood Ln', 'Mulberry St', 'Spruce St', 'Chestnut St', 'Apple St', 'Peach St',
  'Plum St', 'Pear St', 'Orange St', 'Lemon St', 'Grape St', 'Berry Ln', 'Vine St', 'Rose St',
  'Lily St', 'Daisy Ln', 'Tulip St', 'Iris St', 'Orchid St', 'Fern St', 'Palm St', 'Pineapple St',
  'Coconut Ln', 'Banana St', 'Mango St', 'Papaya St', 'Kiwi St', 'Avocado St', 'Olive St', 'Pepper St',
  'Salt St', 'Sugar Ln', 'Spice St', 'Herb St', 'Basil St', 'Thyme St', 'Sage St', 'Rosemary St',
  'Cinnamon St', 'Nutmeg St', 'Ginger St', 'Garlic St', 'Onion St', 'Carrot St', 'Celery St', 'Lettuce Ln',
  'Tomato St', 'Potato St', 'Corn St', 'Bean St', 'Pea St', 'Squash St', 'Pumpkin St', 'Cucumber St'
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
  'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit',
  'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
  'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Long Beach', 'Mesa', 'Atlanta', 'Colorado Springs',
  'Virginia Beach', 'Raleigh', 'Omaha', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Wichita',
  'New Orleans', 'Arlington', 'Cleveland', 'Bakersfield', 'Tampa', 'Aurora', 'Honolulu', 'Anaheim',
  'Santa Ana', 'Corpus Christi', 'Riverside', 'St. Louis', 'Lexington', 'Stockton', 'Pittsburgh', 'Anchorage',
  'Cincinnati', 'Henderson', 'Greensboro', 'Plano', 'Newark', 'Toledo', 'Lincoln', 'Orlando',
  'Chula Vista', 'Irvine', 'Fort Wayne', 'Jersey City', 'Durham', 'St. Petersburg', 'Laredo', 'Buffalo',
  'Madison', 'Lubbock', 'Chandler', 'Scottsdale', 'Glendale', 'Reno', 'Norfolk', 'Winston-Salem',
  'North Las Vegas', 'Irving', 'Chesapeake', 'Gilbert', 'Hialeah', 'Garland', 'Fremont', 'Baton Rouge',
  'Richmond', 'Boise', 'San Bernardino', 'Spokane', 'Des Moines', 'Tacoma', 'Modesto', 'Fontana',
  'Santa Clarita', 'Birmingham', 'Oxnard', 'Fayetteville', 'Moreno Valley', 'Rochester', 'Glendale', 'Huntington Beach',
  'Salt Lake City', 'Grand Rapids', 'Amarillo', 'Yonkers', 'Aurora', 'Montgomery', 'Akron', 'Little Rock',
  'Huntsville', 'Augusta', 'Port St. Lucie', 'Grand Prairie', 'Columbus', 'Tallahassee', 'Overland Park', 'Tempe',
  'McKinney', 'Mobile', 'Cape Coral', 'Shreveport', 'Frisco', 'Knoxville', 'Worcester', 'Brownsville',
  'Vancouver', 'Fort Lauderdale', 'Sioux Falls', 'Ontario', 'Chattanooga', 'Providence', 'Newport News', 'Rancho Cucamonga'
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals = 2): number {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(decimals));
}

function generatePhoneNumber(): string {
  return `+1${getRandomNumber(200, 999)}${getRandomNumber(200, 999)}${getRandomNumber(1000, 9999)}`;
}

function generateAccountNumber(): string {
  return `${getRandomNumber(1000, 9999)}-${getRandomNumber(1000, 9999)}-${getRandomNumber(1000, 9999)}-${getRandomNumber(1000, 9999)}`;
}

function generateReferenceNumber(): string {
  return `REF-${Date.now()}-${getRandomNumber(1000, 9999)}`;
}

function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 99)}@${getRandomElement(domains)}`;
}

async function main() {
  console.log('🌱 Seeding database with rich data...');

  // Clear existing data (optional - comment out if you don't want to clear)
  console.log('Clearing existing data...');
  await prisma.accountTransaction.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.accountType.deleteMany({});
  await prisma.accountStatus.deleteMany({});
  await prisma.transactionType.deleteMany({});
  await prisma.transactionStatus.deleteMany({});
  await prisma.approvalStatus.deleteMany({});
  await prisma.approverRole.deleteMany({});

  // Seed Account Types
  console.log('Creating account types...');
  await prisma.accountType.createMany({
    data: [
      { type: 'savings' },
      { type: 'checking' },
      { type: 'loan' },
      { type: 'credit' }
    ]
  });

  // Seed Account Statuses
  console.log('Creating account statuses...');
  await prisma.accountStatus.createMany({
    data: [
      { status: 'active' },
      { status: 'frozen' },
      { status: 'suspended' },
      { status: 'closed' }
    ]
  });

  // Seed Transaction Types
  console.log('Creating transaction types...');
  await prisma.transactionType.createMany({
    data: [
      { type: 'deposit' },
      { type: 'withdrawal' },
      { type: 'transfer' },
      { type: 'payment' },
      { type: 'interest' },
      { type: 'fee' }
    ]
  });

  // Seed Transaction Statuses
  console.log('Creating transaction statuses...');
  await prisma.transactionStatus.createMany({
    data: [
      { status: 'pending' },
      { status: 'completed' },
      { status: 'failed' }
    ]
  });

  // Seed Approval Statuses
  console.log('Creating approval statuses...');
  await prisma.approvalStatus.createMany({
    data: [
      { status: 'pending' },
      { status: 'approved' },
      { status: 'rejected' }
    ]
  });

  // Seed Approver Roles
  console.log('Creating approver roles...');
  await prisma.approverRole.createMany({
    data: [
      { role: 'teller' },
      { role: 'manager' },
      { role: 'seniormanager' }
    ]
  });

  // Get reference IDs
  const accountTypes = await prisma.accountType.findMany();
  const accountStatuses = await prisma.accountStatus.findMany();
  const transactionTypes = await prisma.transactionType.findMany();
  const transactionStatuses = await prisma.transactionStatus.findMany();
  const approvalStatuses = await prisma.approvalStatus.findMany();
  const approverRoles = await prisma.approverRole.findMany();

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bank.com',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // Create Managers (5 managers)
  console.log('Creating managers...');
  const managers = [];
  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const hashedPassword = await bcrypt.hash('manager123', 10);
    const manager = await prisma.user.create({
      data: {
        email: generateEmail(firstName, lastName),
        firstName,
        lastName,
        password: hashedPassword,
        phone: generatePhoneNumber(),
        role: 'MANAGER',
        status: 'ACTIVE'
      }
    });
    managers.push(manager);
  }

  // Create Tellers (10 tellers)
  console.log('Creating tellers...');
  const tellers = [];
  for (let i = 0; i < 10; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const hashedPassword = await bcrypt.hash('teller123', 10);
    const teller = await prisma.user.create({
      data: {
        email: generateEmail(firstName, lastName),
        firstName,
        lastName,
        password: hashedPassword,
        phone: generatePhoneNumber(),
        role: 'TELLER',
        status: 'ACTIVE'
      }
    });
    tellers.push(teller);
  }

  // Create Customers (200 customers)
  console.log('Creating customers...');
  const customers = [];
  for (let i = 0; i < 200; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const hashedPassword = await bcrypt.hash('customer123', 10);
    const status = Math.random() > 0.95 ? 'BANNED' : 'ACTIVE'; // 5% banned
    
    const customer = await prisma.user.create({
      data: {
        email: generateEmail(firstName, lastName),
        firstName,
        lastName,
        password: hashedPassword,
        phone: generatePhoneNumber(),
        role: 'CUSTOMER',
        status: status as any
      }
    });
    customers.push(customer);
  }

  // Create Accounts for customers (2-4 accounts per customer)
  console.log('Creating accounts...');
  const allAccounts = [];
  for (const customer of customers) {
    const numAccounts = getRandomNumber(2, 4);
    for (let i = 0; i < numAccounts; i++) {
      const accountType = getRandomElement(accountTypes);
      const accountStatus = Math.random() > 0.95 ? 
        getRandomElement(accountStatuses.filter(s => s.status !== 'active')) : 
        accountStatuses.find(s => s.status === 'active')!;
      
      let balance = getRandomFloat(100, 50000);
      let loanAmount = null;
      let monthlyPayment = null;
      let interestRate = null;
      let minimumBalance = null;
      let transactionLimit = null;
      let overdraftLimit = null;
      let monthlyWithdrawalLimit = null;
      let minimumPayment = null;
      let dueDate = null;

      if (accountType.type === 'loan') {
        loanAmount = getRandomFloat(5000, 100000);
        monthlyPayment = getRandomFloat(100, 2000);
        interestRate = getRandomFloat(3, 12);
        dueDate = new Date(Date.now() + getRandomNumber(30, 365) * 24 * 60 * 60 * 1000);
        balance = -loanAmount; // Negative balance for loans
      } else if (accountType.type === 'credit') {
        loanAmount = getRandomFloat(1000, 25000);
        minimumPayment = getRandomFloat(20, 500);
        interestRate = getRandomFloat(15, 25);
        dueDate = new Date(Date.now() + getRandomNumber(15, 30) * 24 * 60 * 60 * 1000);
        balance = -loanAmount; // Negative balance for credit
      } else if (accountType.type === 'savings') {
        minimumBalance = getRandomFloat(100, 1000);
        interestRate = getRandomFloat(0.5, 3);
        transactionLimit = getRandomFloat(500, 5000);
        monthlyWithdrawalLimit = getRandomNumber(5, 20);
      } else if (accountType.type === 'checking') {
        minimumBalance = getRandomFloat(50, 500);
        overdraftLimit = getRandomFloat(100, 1000);
        transactionLimit = getRandomFloat(1000, 10000);
      }

      const account = await prisma.account.create({
        data: {
          accountNumber: generateAccountNumber(),
          customerId: customer.id,
          accountTypeId: accountType.id,
          accountStatusId: accountStatus.id,
          balance: balance,
          minimumBalance: minimumBalance,
          transactionLimit: transactionLimit,
          interestRate: interestRate,
          minimumPayment: minimumPayment,
          dueDate: dueDate,
          monthlyWithdrawalLimit: monthlyWithdrawalLimit,
          overdraftLimit: overdraftLimit,
          loanAmount: loanAmount,
          monthlyPayment: monthlyPayment,
          createdAt: new Date(Date.now() - getRandomNumber(1, 365) * 24 * 60 * 60 * 1000)
        }
      });
      allAccounts.push(account);
    }
  }

  // Create Transactions (10-50 transactions per account)
  console.log('Creating transactions...');
  const allTransactions = [];
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // One year ago

  for (const account of allAccounts) {
    const numTransactions = getRandomNumber(10, 50);
    for (let i = 0; i < numTransactions; i++) {
      const transactionDate = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
      const transactionType = getRandomElement(transactionTypes);
      const transactionStatus = getRandomElement(transactionStatuses);
      const amount = getRandomFloat(10, 5000);
      
      let fromAccountId = null;
      let toAccountId = null;
      
      if (transactionType.type === 'transfer') {
        // For transfers, randomly select another account
        const otherAccounts = allAccounts.filter(a => a.id !== account.id);
        if (otherAccounts.length > 0) {
          if (Math.random() > 0.5) {
            fromAccountId = account.id;
            toAccountId = getRandomElement(otherAccounts).id;
          } else {
            fromAccountId = getRandomElement(otherAccounts).id;
            toAccountId = account.id;
          }
        }
      }

      const transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          userId: account.customerId,
          transactionStatusId: transactionStatus.id,
          transactionTypeId: transactionType.id,
          amount: amount,
          fromAccountId: fromAccountId,
          toAccountId: toAccountId,
          referenceNumber: generateReferenceNumber(),
          createdAt: transactionDate,
          isScheduled: false
        }
      });
      allTransactions.push(transaction);

      // Create AccountTransaction record
      const balanceBefore = account.balance - (transactionType.type === 'deposit' ? -amount : amount);
      const balanceAfter = account.balance;
      
      await prisma.accountTransaction.create({
        data: {
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          accountId: account.id,
          transactionId: transaction.id,
          createdAt: transactionDate
        }
      });

      // Update account balance
      if (transactionType.type === 'deposit') {
        account.balance += amount;
      } else if (transactionType.type === 'withdrawal') {
        account.balance -= amount;
      }
    }

    // Update the account with final balance
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance }
    });
  }

  // Create Approvals for some transactions (10% of transactions)
  console.log('Creating approvals...');
  const approvalTransactions = allTransactions.filter(() => Math.random() < 0.1);
  
  for (const transaction of approvalTransactions) {
    const approver = getRandomElement([...tellers, ...managers]);
    const approverRole = approver.role === 'TELLER' ? 
      approverRoles.find(r => r.role === 'teller')! : 
      approverRoles.find(r => r.role === 'manager')!;
    
    const approvalStatus = getRandomElement(approvalStatuses);
    
    await prisma.approval.create({
      data: {
        transactionId: transaction.id,
        approverId: approver.id,
        approverRoleId: approverRole.id,
        approverLimit: getRandomFloat(1000, 10000),
        comments: Math.random() > 0.7 ? 'Approved after review' : null,
        statusId: approvalStatus.id,
        createdAt: new Date(transaction.createdAt.getTime() + getRandomNumber(1, 60) * 60 * 1000)
      }
    });
  }

  // Create Notifications (5-10 per user)
  console.log('Creating notifications...');
  const allUsers = [admin, ...managers, ...tellers, ...customers];
  const notificationTitles = [
    'Welcome to Our Bank!',
    'Account Statement Available',
    'Transaction Completed',
    'Low Balance Alert',
    'Overdraft Protection Activated',
    'New Credit Card Offer',
    'Security Alert: Suspicious Activity',
    'Monthly Account Maintenance',
    'Interest Credited to Your Account',
    'Loan Payment Due Reminder',
    'Credit Limit Increased',
    'New Feature Available',
    'System Maintenance Notice',
    'Holiday Schedule Update',
    'Fraud Prevention Tips'
  ];

  const notificationMessages = [
    'Thank you for choosing our bank. We are committed to providing you with excellent service.',
    'Your monthly account statement is now available for download.',
    'A transaction of ${amount} has been completed on your account.',
    'Your account balance is below the minimum required amount.',
    'Overdraft protection has been activated on your account.',
    'You are pre-approved for a new credit card with special benefits.',
    'We detected unusual activity on your account. Please review your transactions.',
    'Monthly maintenance fee has been applied to your account.',
    'Interest of ${amount} has been credited to your savings account.',
    'Your loan payment of ${amount} is due on ${date}.',
    'Your credit limit has been increased to ${amount}.',
    'Check out our new mobile banking features in the latest app update.',
    'Our systems will undergo maintenance on Saturday from 2 AM to 4 AM.',
    'Our branches will be closed on the following holidays: New Year\'s Day, Christmas.',
    'Learn how to protect yourself from fraud with our security guide.'
  ];

  for (const user of allUsers) {
    const numNotifications = getRandomNumber(5, 10);
    for (let i = 0; i < numNotifications; i++) {
      const notificationType = getRandomElement(['TRANSACTION', 'SYSTEM', 'ACCOUNT']);
      const title = getRandomElement(notificationTitles);
      let message = getRandomElement(notificationMessages);
      
      // Replace placeholders in messages
      message = message
        .replace('${amount}', `$${getRandomFloat(10, 1000).toFixed(2)}`)
        .replace('${date}', new Date(Date.now() + getRandomNumber(1, 30) * 24 * 60 * 60 * 1000).toLocaleDateString());
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: title,
          message: message,
          type: notificationType as any,
          isRead: Math.random() > 0.3,
          createdAt: new Date(Date.now() - getRandomNumber(1, 90) * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`📊 Data Summary:`);
  console.log(`   - Admin Users: 1`);
  console.log(`   - Manager Users: ${managers.length}`);
  console.log(`   - Teller Users: ${tellers.length}`);
  console.log(`   - Customer Users: ${customers.length}`);
  console.log(`   - Bank Accounts: ${allAccounts.length}`);
  console.log(`   - Transactions: ${allTransactions.length}`);
  console.log(`   - Approvals: ${approvalTransactions.length}`);
  console.log(`   - Notifications: ${allUsers.length * 7} (approx)`);
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('   Admin: admin@bank.com / admin123');
  console.log('   Manager: [any manager email] / manager123');
  console.log('   Teller: [any teller email] / teller123');
  console.log('   Customer: [any customer email] / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });