package com.bairamburguer.api.config;

import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.models.User;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import com.bairamburguer.api.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.repositories.NeighborhoodRepository;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final NeighborhoodRepository neighborhoodRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Verifica e garante que o Admin existe e tem a senha hasheada
        User admin = userRepository.findByEmail("admin@bairamburguer.com").orElse(new User());
        admin.setName("Bernardo Admin");
        admin.setEmail("admin@bairamburguer.com");
        admin.setRole("ADMIN");
        
        // Se a senha estiver nula ou não parecer um hash BCrypt (que começa com $2a$ ou $2b$)
        if (admin.getPassword() == null || !admin.getPassword().startsWith("$2a$")) {
            admin.setPassword(passwordEncoder.encode("admin"));
            System.out.println("DatabaseSeeder: Senha do Admin foi (re)hasheada com BCrypt!");
        }
        userRepository.save(admin);
        System.out.println("DatabaseSeeder: Usuário Admin validado com sucesso!");

        if (neighborhoodRepository.count() == 0) {
            String[] nomes = {"Mangabeira", "Bancários", "Cabo Branco", "Tambaú", "Centro"};
            String[] taxas = {"5.00", "7.00", "10.00", "10.00", "8.00"};
            for (int i = 0; i < nomes.length; i++) {
                Neighborhood n = new Neighborhood();
                n.setName(nomes[i]);
                n.setDeliveryFee(new BigDecimal(taxas[i]));
                neighborhoodRepository.save(n);
            }
            System.out.println("DatabaseSeeder: Bairros cadastrados com sucesso!");
        }

        if (productRepository.count() == 0) {
            // Categorias
            Category catMaluca = new Category();
            catMaluca.setName("BAIRAM MALUCA");
            catMaluca = categoryRepository.save(catMaluca);

            Category catCombos = new Category();
            catCombos.setName("COMBOS");
            catCombos = categoryRepository.save(catCombos);

            Category catComplementos = new Category();
            catComplementos.setName("COMPLEMENTOS");
            catComplementos = categoryRepository.save(catComplementos);

            // Produtos BAIRAM MALUCA
            Product p1 = new Product();
            p1.setCategory(catMaluca);
            p1.setName("Bairam Barca Cremosa");
            p1.setPrice(new BigDecimal("45.00"));
            p1.setDescription("2 X-Bairam Repartidos ao Molho Cheddar e Batata Reta.");
            p1.setImageUrl("/images/combobairambarcacremosa.jpg");
            productRepository.save(p1);

            Product p2 = new Product();
            p2.setCategory(catMaluca);
            p2.setName("Bairam Big Monstro");
            p2.setPrice(new BigDecimal("29.99"));
            p2.setDescription("Pão Brioche Amanteigado, 2 Carnes Artesanais, muito queijo e molho especial.");
            p2.setImageUrl("/images/bairambigmonstro.jpg");
            productRepository.save(p2);

            Product p3 = new Product();
            p3.setCategory(catMaluca);
            p3.setName("Bairam Burguer + Refrigerante");
            p3.setPrice(new BigDecimal("26.99"));
            p3.setDescription("Pão Brioche Amanteigado, Carne Artesanal perfeitamente grelhada, queijo derretido e um refrigerante trincando de gelado.");
            p3.setImageUrl("/images/bairamburguer.jpg");
            productRepository.save(p3);

            Product p4 = new Product();
            p4.setCategory(catMaluca);
            p4.setName("Bairam Cheddar");
            p4.setPrice(new BigDecimal("17.99"));
            p4.setDescription("Pão Brioche Amanteigado, Carne Artesanal e uma camada generosa de queijo cheddar derretido.");
            p4.setImageUrl("/images/bairamcheddar.jpg");
            productRepository.save(p4);

            Product p5 = new Product();
            p5.setCategory(catMaluca);
            p5.setName("Bairam Double");
            p5.setPrice(new BigDecimal("29.99"));
            p5.setDescription("Para quem tem fome de verdade: duas carnes artesanais de 150g e muito queijo.");
            p5.setImageUrl("/images/bairamdouble.jpg");
            productRepository.save(p5);

            Product p6 = new Product();
            p6.setCategory(catMaluca);
            p6.setName("Bairamel");
            p6.setPrice(new BigDecimal("29.99"));
            p6.setDescription("Combinação exclusiva da casa trazendo um toque agridoce especial ao seu blend artesanal.");
            p6.setImageUrl("/images/bairammel.jpg");
            productRepository.save(p6);

            Product p7 = new Product();
            p7.setCategory(catMaluca);
            p7.setName("Big Bairam");
            p7.setPrice(new BigDecimal("24.99"));
            p7.setDescription("O clássico tamanho família com alface, tomate, queijo e o blend da casa.");
            p7.setImageUrl("/images/bigbairam.jpg");
            productRepository.save(p7);

            // Produtos COMBOS
            Product p8 = new Product();
            p8.setCategory(catCombos);
            p8.setName("Combo Bairam Casal");
            p8.setPrice(new BigDecimal("45.00"));
            p8.setDescription("1 Bairam Burguer + Batata Frita G + Refrigerante de 1L à sua escolha.");
            p8.setImageUrl("/images/combocasal.jpg");
            productRepository.save(p8);

            Product p9 = new Product();
            p9.setCategory(catCombos);
            p9.setName("Quarteto Bairam 1.0");
            p9.setPrice(new BigDecimal("70.00"));
            p9.setDescription("4 Bairam Cheddar + 1 Refrigerante de 1L + 2 Batatas Fritas P.");
            p9.setImageUrl("/images/quartetobairam1.jpg");
            productRepository.save(p9);

            Product p10 = new Product();
            p10.setCategory(catCombos);
            p10.setName("Quarteto Bairam 2.0");
            p10.setPrice(new BigDecimal("80.00"));
            p10.setDescription("1 Bairam Cheddar + 1 Big Bairam + 1 Bairam Double + 1 Bairam Burguer + Batata G.");
            p10.setImageUrl("/images/quartetobairam.jpg");
            productRepository.save(p10);

            // Produtos COMPLEMENTOS
            Product p11 = new Product();
            p11.setCategory(catComplementos);
            p11.setName("Bairam Recheada");
            p11.setPrice(new BigDecimal("25.00"));
            p11.setDescription("Porção de 300g de batata-frita crocante coberta com muito Cheddar Cremoso e Bacon picadinho.");
            p11.setImageUrl("/images/bairamrecheada.jpg");
            productRepository.save(p11);

            Product p12 = new Product();
            p12.setCategory(catComplementos);
            p12.setName("Batata-Frita (Porção P)");
            p12.setPrice(new BigDecimal("10.00"));
            p12.setDescription("Porção individual de 150g de batatas fritas sequinhas e crocantes.");
            p12.setImageUrl("/images/fritasP.jpg");
            productRepository.save(p12);
            
            System.out.println("DatabaseSeeder: Categorias e Produtos reais cadastrados com sucesso!");
        }
    }
}
