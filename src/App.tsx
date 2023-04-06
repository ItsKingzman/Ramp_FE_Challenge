import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(() => paginatedTransactions?.data ?? transactionsByEmployee ?? null, [
    paginatedTransactions,
    transactionsByEmployee,
  ])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const handleTransactionApprovalChange = useCallback(() => {
    if (transactionsByEmployee !== null) {
      loadTransactionsByEmployee(transactionsByEmployee[0]?.employee.id ?? "")
    } else {
      loadAllTransactions()
    }
  }, [transactionsByEmployee, loadTransactionsByEmployee, loadAllTransactions])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions, transactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading || paginatedTransactionsUtils.loading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            newValue.id !== ""
              ? await loadTransactionsByEmployee(newValue.id)
              : await loadAllTransactions()
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={transactions}
            onTransactionApprovalChange={handleTransactionApprovalChange}
          />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={
                paginatedTransactionsUtils.loading || paginatedTransactions?.nextPage == null
                  ? true
                  : false
              }
              onClick={async () => {
                await paginatedTransactionsUtils.fetchNextPage()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
