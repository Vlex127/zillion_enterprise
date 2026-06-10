import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { getAllUsers } from "@/lib/queries"
import { StaffClient } from "./client"

export default async function StaffPage() {
  const users = await getAllUsers()

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Staff</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <StaffClient users={users} />
    </div>
  )
}
