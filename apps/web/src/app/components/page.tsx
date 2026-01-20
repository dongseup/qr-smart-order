"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function ComponentsPage() {
  const [inputValue, setInputValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">UI Components</h1>
        <p className="text-muted-foreground">
          제작된 shadcn/ui 기반 컴포넌트 데모 페이지
        </p>
      </div>

      {/* Button Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Button</h2>
        <Card>
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>다양한 버튼 스타일</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🚀</Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Card Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>기본 카드</CardTitle>
              <CardDescription>카드 컴포넌트 기본 예시</CardDescription>
            </CardHeader>
            <CardContent>
              <p>카드 내용이 여기에 표시됩니다.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                액션
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>메뉴 카드 예시</CardTitle>
              <CardDescription>아메리카노</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">가격</span>
                  <span className="font-semibold">4,500원</span>
                </div>
                <Badge variant="secondary">판매중</Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">
                상세보기
              </Button>
              <Button size="sm">주문하기</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Input Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Input</h2>
        <Card>
          <CardHeader>
            <CardTitle>입력 필드</CardTitle>
            <CardDescription>다양한 입력 필드 예시</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">기본 입력</label>
              <Input placeholder="텍스트를 입력하세요" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">값이 있는 입력</label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="입력해보세요"
              />
              <p className="text-xs text-muted-foreground">
                입력값: {inputValue || "(없음)"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">비활성화된 입력</label>
              <Input placeholder="비활성화됨" disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">숫자 입력</label>
              <Input type="number" placeholder="0" min="0" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badge Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Badge</h2>
        <Card>
          <CardHeader>
            <CardTitle>뱃지</CardTitle>
            <CardDescription>상태 표시용 뱃지 컴포넌트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">사용 예시</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>주문 상태:</span>
                  <Badge variant="default">대기중</Badge>
                  <Badge variant="secondary">조리중</Badge>
                  <Badge variant="outline">준비완료</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>메뉴 상태:</span>
                  <Badge variant="secondary">판매중</Badge>
                  <Badge variant="destructive">품절</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skeleton Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Skeleton</h2>
        <Card>
          <CardHeader>
            <CardTitle>스켈레톤 로딩</CardTitle>
            <CardDescription>로딩 상태 표시용 컴포넌트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">카드 스켈레톤 예시</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">리스트 스켈레톤 예시</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialog Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Dialog</h2>
        <Card>
          <CardHeader>
            <CardTitle>모달 다이얼로그</CardTitle>
            <CardDescription>팝업 모달 컴포넌트</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* 기본 Dialog */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">기본 모달 열기</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>모달 제목</DialogTitle>
                    <DialogDescription>
                      이것은 기본 모달 다이얼로그입니다. X 버튼이나 배경을 클릭하여 닫을 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p>모달 내용이 여기에 표시됩니다.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={() => setDialogOpen(false)}>확인</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 확인 Dialog */}
              <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">삭제 확인</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
                    <DialogDescription>
                      이 작업은 되돌릴 수 없습니다. 이 항목이 영구적으로 삭제됩니다.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                      취소
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmDialogOpen(false)}>
                      삭제
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">메뉴 상세 모달 예시</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">메뉴 상세보기</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>아메리카노</DialogTitle>
                    <DialogDescription>4,500원</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-6xl">☕</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">수량</span>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="icon" className="h-11 w-11">
                            -
                          </Button>
                          <span className="w-12 text-center font-semibold text-lg">1</span>
                          <Button variant="outline" size="icon" className="h-11 w-11">
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t pt-4">
                        <span className="text-lg font-semibold">총 가격</span>
                        <span className="text-2xl font-bold">4,500원</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full">장바구니에 추가</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Combination Example */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">조합 예시</h2>
        <Card>
          <CardHeader>
            <CardTitle>실제 사용 예시</CardTitle>
            <CardDescription>여러 컴포넌트를 조합한 예시</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 메뉴 카드 예시 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>아메리카노</CardTitle>
                      <CardDescription>진한 에스프레소와 물</CardDescription>
                    </div>
                    <Badge variant="secondary">판매중</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">4,500원</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          -
                        </Button>
                        <Input
                          type="number"
                          value="1"
                          className="w-16 text-center"
                          readOnly
                        />
                        <Button variant="outline" size="icon">
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">장바구니에 추가</Button>
                </CardFooter>
              </Card>

              {/* 주문 카드 예시 */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>주문 #001</CardTitle>
                      <CardDescription>2024-01-20 10:30</CardDescription>
                    </div>
                    <Badge variant="default">대기중</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>아메리카노 x2</span>
                      <span>9,000원</span>
                    </div>
                    <div className="flex justify-between">
                      <span>카페라떼 x1</span>
                      <span>5,000원</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>총액</span>
                        <span>14,000원</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    취소
                  </Button>
                  <Button className="flex-1">상세보기</Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground py-8">
        <p>이 페이지는 shadcn/ui 기반 컴포넌트 데모입니다.</p>
        <p className="mt-2">
          <a
            href="/"
            className="text-primary hover:underline"
          >
            ← 홈으로 돌아가기
          </a>
        </p>
      </div>
    </div>
  );
}
