<script setup lang="ts">
const { isAuthenticated } = useAuth()

await navigateTo(isAuthenticated() ? '/dashboard' : '/auth/signin')
</script>
