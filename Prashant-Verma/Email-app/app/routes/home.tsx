import { useLoaderData } from "@remix-run/react";
import { fetchEmailsForAccount } from "../../email.js";
import { PrismaClient } from "@prisma/client";
import { useState } from "react";

const prisma = new PrismaClient();

export const loader = async () => {
  const accounts = [
    {
      user: process.env.EMAIL_1_USER,
      password: process.env.EMAIL_1_PASSWORD,
      host: process.env.EMAIL_1_HOST,
      port: process.env.EMAIL_1_PORT,
      tls: process.env.EMAIL_1_TLS === "true",
    },
    {
      user: process.env.EMAIL_2_USER,
      password: process.env.EMAIL_2_PASSWORD,
      host: process.env.EMAIL_2_HOST,
      port: process.env.EMAIL_2_PORT,
      tls: process.env.EMAIL_2_TLS === "true",
    },
  ];

  const emailsByAccount = await Promise.all(
    accounts.map(async (account) => {
      return {
        account: account.user,
        emails: await fetchEmailsForAccount(account),
      };
    })
  );

  return emailsByAccount;
};

export default function Index() {
  const emailsByAccount = useLoaderData();
  const [selectedAccount, setSelectedAccount] = useState(emailsByAccount[0].account);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // Search functionality state

  const selectedAccountEmails = emailsByAccount.find(
    (account) => account.account === selectedAccount
  )?.emails;

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredEmails = selectedAccountEmails?.filter((email) =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {/* <header className="bg-blue-500 text-white p-4">
        <div className="flex justify-between items-center">
          <h1>Email Client</h1>
          <div className="dropdown">
            <select
              className="text-black"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {emailsByAccount.map((account, index) => (
                <option key={index} value={account.account}>
                  {account.account}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header> */}

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
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
                onClick={() => setSelectedAccount(account.account)}
              >
                📧 {account.account}
              </button>
            ))}
            <button className="w-full text-left p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none">
              ➕ Add Account
            </button>
          </div>
        </aside>

        {/* Email View */}
        <main className="flex-1 p-4 bg-white">
          {/* Search Bar */}
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="🔍 Search emails..."
              className="w-full p-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Email List */}
          <div className="bg-gray-100 p-4 rounded-md mb-4">
            <div className="flex justify-between font-bold p-2 bg-gray-300 rounded-md">
              <div className="w-1/3">Sender</div>
              <div className="w-1/2">Subject</div>
              <div className="w-1/6 text-right">Date</div>
              <div className="w-1/6 text-right">Actions</div>
            </div>

            <div className="divide-y divide-gray-300">
              {filteredEmails?.map((email, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleEmailSelect(email)}
                >
                  <div className="w-1/3">{email.from}</div>
                  <div className="w-1/2">{email.subject || "No Subject"}</div>
                  <div className="w-1/6 text-right">
                    {new Date(email.date).toLocaleDateString()}
                  </div>
                  <div className="w-1/6 text-right">
                    <button className="mr-2">⚙️</button>
                    <button>🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination (if needed) */}
            <div className="mt-4 text-center">
              ◀️ 1 of 10 ▶️
            </div>
          </div>

          {/* Full Email View */}
          <div className="bg-gray-100 p-6 rounded-md">
            <h2 className="text-2xl font-bold">
              {selectedEmail ? selectedEmail.subject : "Select an Email"}
            </h2>

            {selectedEmail ? (
              <div className="mt-4 space-y-2">
                <p>
                  <span className="font-semibold">From: </span>
                  {selectedEmail.from}
                </p>
                <p>
                  <span className="font-semibold">To: </span>
                  {selectedEmail.to}
                </p>
                <p>
                  <span className="font-semibold">Date: </span>
                  {new Date(selectedEmail.date).toLocaleString()}
                </p>
                <p className="mt-4">{selectedEmail.bodyText}</p>
              </div>
            ) : (
              <p className="mt-4">This is where the email details would be displayed.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
