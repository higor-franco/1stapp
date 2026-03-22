package handler

import (
	"testing"
)

func TestFilterStrings(t *testing.T) {
	tests := []struct {
		name  string
		input []string
		want  []string
	}{
		{
			name:  "removes empty strings",
			input: []string{"pizza SP", "", "delivery", ""},
			want:  []string{"pizza SP", "delivery"},
		},
		{
			name:  "trims whitespace",
			input: []string{"  barbearia  ", " salão "},
			want:  []string{"barbearia", "salão"},
		},
		{
			name:  "nil input returns empty",
			input: nil,
			want:  []string{},
		},
		{
			name:  "all empty strings",
			input: []string{"", " ", "  "},
			want:  []string{},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := filterStrings(tc.input)
			if len(got) != len(tc.want) {
				t.Fatalf("filterStrings(%v) = %v, want %v", tc.input, got, tc.want)
			}
			for i, v := range got {
				if v != tc.want[i] {
					t.Errorf("filterStrings[%d] = %q, want %q", i, v, tc.want[i])
				}
			}
		})
	}
}
