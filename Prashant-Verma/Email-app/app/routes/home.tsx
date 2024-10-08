import { Outlet, useLoaderData, Link,  useNavigate } from "@remix-run/react";
import { fetchEmailsForAccount } from "../../email.js";
import { useState } from "react";

const EMAILS_PER_PAGE = 1;

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const currentPage = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = EMAILS_PER_PAGE;

  const accounts = [
    {
      user: process.env.EMAIL_1_USER,
      password: process.env.EMAIL_1_PASSWORD,
      host: process.env.EMAIL_1_HOST,
      port: process.env.EMAIL_1_PORT
        ? parseInt(process.env.EMAIL_1_PORT, 10)
        : null,
      tls: process.env.EMAIL_1_TLS === "true",
    },
    {
      user: process.env.EMAIL_2_USER,
      password: process.env.EMAIL_2_PASSWORD,
      host: process.env.EMAIL_2_HOST,
      port: process.env.EMAIL_2_PORT
        ? parseInt(process.env.EMAIL_2_PORT, 10)
        : null,
      tls: process.env.EMAIL_2_TLS === "true",
    },
  ];

  const emailsByAccount = await Promise.all(
    accounts.map(async (account) => {
      if (!account.user) return null;
      const { emails, totalEmails } = await fetchEmailsForAccount(account, currentPage, pageSize);
      return {
        account: account.user,
        emails,
        totalEmails, // Total emails count to calculate total pages
      };
    })
  );

  const filteredEmailsByAccount = emailsByAccount.filter(
    (account) => account !== null
  );

  return {
    emailsByAccount: filteredEmailsByAccount,
    currentPage,
    pageSize,
  };
};

export default function Index() {
  const { emailsByAccount, currentPage, pageSize } = useLoaderData();
  const navigate = useNavigate();

  const [selectedAccount, setSelectedAccount] = useState(
    emailsByAccount[0]?.account || ""
  );
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAccountData = emailsByAccount.find(
    (account) => account.account === selectedAccount
  );
  const selectedAccountEmails = selectedAccountData?.emails || [];
  const totalEmails = selectedAccountData?.totalEmails || 0;

  const totalPages = Math.ceil(totalEmails / pageSize);

  const handlePageChange = (newPage) => {
    navigate(`/?page=${newPage}`);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter emails based on search query
  const filteredEmails = selectedAccountEmails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <aside className="w-1/4 bg-gray-200 p-4">
          <div className="space-y-4">
            <h2 className="font-bold text-xl">📨 Your Email Accounts</h2>
            {emailsByAccount.map((account, index) => (
              <button
                key={index}
                className={`w-full text-left p-2 rounded-md ${
                  account.account === selectedAccount
                    ? "bg-blue-200"
                    : "bg-white"
                } border border-gray-300 hover:bg-gray-100 focus:outline-none`}
                onClick={() => {
                  setSelectedAccount(account.account);
                  handlePageChange(1); // Reset to the first page when switching accounts
                }}
              >
                📧 {account.account}
              </button>
            ))}
            <button className="w-full text-left p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none">
              ➕ Add Account
            </button>
          </div>
        </aside>

        <main className="flex-1 p-4 bg-white">
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="🔍 Search emails..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="flex justify-between font-bold p-2 bg-gray-300 rounded-md">
              <div className="w-1/3">Sender</div>
              <div className="w-1/2">Subject</div>
              <div className="w-1/6 text-right">Date</div>
            </div>

            <div className="divide-y divide-gray-300">
              {filteredEmails.map((email) => (
                <Link
                  key={email.id}
                  to={`/emails/${email.id}`} // Link to the email details route
                  className="block"
                >
                  <div className="flex justify-between items-center p-2 hover:bg-gray-200 cursor-pointer">
                    <div className="w-1/3">{email.from}</div>
                    <div className="w-1/2">{email.subject || "No Subject"}</div>
                    <div className="w-1/6 text-right">
                      {new Date(email.date).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 text-center">
              <button
                className="mr-2"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ◀️
              </button>
              <span>
                {currentPage} of {totalPages}
              </span>
              <button
                className="ml-2"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                ▶️
              </button>
            </div>
          </div>

          {/* Nested routes will be rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

