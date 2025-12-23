
const PATHS = {
    home: {
        index: "/",
    },
    auth: {
        login: "/auth/login",
        register: "/auth/register",
    },
    admin: {
        index: "/admin",
        employees: "/admin/employees",
        employee: (id:number) => `/admin/employees/${id}`,
        customers: "/admin/customers",
        accounts: "/admin/accounts",
    },
    customer: {
        index: "/customer"
    },
    teller: {
        index: "/teller"
    },
    manager: {
        index: "/manager"
    }
};

export default PATHS;