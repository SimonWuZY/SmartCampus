import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const SideNavigatar = () => {
    return (
        <div className="p-4">
            <Card className="w-100px h-200px shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">侧边导航</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-xs text-gray-600">导航内容</p>
                </CardContent>
            </Card>
        </div>
    )
}